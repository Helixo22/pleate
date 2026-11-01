// FlyingPosters: a column of posters streaming upward past the viewer as if around the inside of a drum: they
// come from below tipped back, face you in the middle and fly off tipped forward. Dragging (or the arrow keys
// when focused) pushes the stream and it bends harder the faster it goes, then settles back to a slow drift.
// Reduced motion stops the drift (dragging still works).
"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type FlyingPostersProps = {
  images: { src: string; alt: string }[];
  /** Poster size, px. */
  posterWidth?: number;
  posterHeight?: number;
  /** Gap between posters, px. */
  gap?: number;
  /** Idle drift, px per second (0 stops it). */
  drift?: number;
  /** How much the stream bends, 0 to 1. */
  bend?: number;
  /** Height of the viewport, px. */
  height?: number;
  /** Accessible name of the stream. */
  label?: string;
  className?: string;
};

export function FlyingPosters({ images, posterWidth = 220, posterHeight = 300, gap = 40, drift = 40, bend = 0.6, height = 520, label = "Posters", className }: FlyingPostersProps) {
  const reduced = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const state = useRef({ offset: 0, velocity: 0, drag: null as null | { y: number; last: number; t: number } });

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const posters = [...el.children] as HTMLElement[];
    const step = posterHeight + gap;
    const loop = step * posters.length;
    let frame = 0;
    let then = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - then) / 1000);
      then = now;
      const s = state.current;
      if (!s.drag) {
        s.offset += (s.velocity + (reduced ? 0 : drift)) * dt;
        s.velocity *= Math.exp(-dt * 3);
      }
      const speedBend = Math.min(1, Math.abs(s.velocity) / 1500);
      const half = el.clientHeight / 2;
      posters.forEach((poster, i) => {
        // Position from the middle, wrapped so the column never ends.
        let y = (((i * step - s.offset) % loop) + loop) % loop;
        if (y > loop / 2) y -= loop;
        const t = Math.max(-1.4, Math.min(1.4, y / (half + posterHeight)));
        const tilt = t * (35 + 30 * speedBend) * bend;
        const z = -(Math.abs(t) ** 2) * 260 * bend;
        poster.style.transform = `translate3d(-50%, calc(-50% + ${y}px), ${z}px) rotateX(${-tilt}deg) scaleY(${1 + speedBend * 0.15 * bend})`;
        poster.style.opacity = String(Math.max(0, 1 - Math.max(0, Math.abs(t) - 0.9) * 2));
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [posterHeight, gap, drift, bend, reduced, images.length]);

  const onKeyDown = (event: KeyboardEvent) => {
    const push = { ArrowDown: 900, ArrowUp: -900, PageDown: 2400, PageUp: -2400 }[event.key];
    if (push === undefined) return;
    event.preventDefault();
    state.current.velocity += push;
  };

  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        state.current.drag = { y: event.clientY, last: 0, t: performance.now() };
        state.current.velocity = 0;
      }}
      onPointerMove={(event) => {
        const d = state.current.drag;
        if (!d) return;
        const now = performance.now();
        const dy = event.clientY - d.y;
        state.current.offset -= dy;
        state.current.velocity = (-dy / Math.max(1, now - d.t)) * 1000;
        d.y = event.clientY;
        d.t = now;
      }}
      onPointerUp={() => (state.current.drag = null)}
      onPointerCancel={() => (state.current.drag = null)}
      className={cn("pl-focus-ring relative w-full cursor-grab touch-none overflow-hidden rounded-2xl select-none active:cursor-grabbing [perspective:900px]", className)}
      style={{ height }}
    >
      <div ref={stage} className="absolute inset-0 [transform-style:preserve-3d]">
        {images.map((image, i) => (
          <img
            key={image.src + i}
            src={image.src}
            alt={image.alt}
            draggable={false}
            loading="lazy"
            className="absolute top-1/2 left-1/2 rounded-xl bg-fill-3 object-cover shadow-[0_16px_40px_rgb(0_0_0/0.3)] will-change-transform"
            style={{ width: posterWidth, height: posterHeight, maxWidth: "80%" }}
          />
        ))}
      </div>
    </div>
  );
}
