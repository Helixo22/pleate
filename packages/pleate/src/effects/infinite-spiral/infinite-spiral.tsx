// InfiniteSpiral: images on an endless 3D helix that climbs and turns on its own. Drag or arrow keys push it,
// hover or focus pauses it, and items fade out at both ends so the loop never shows a seam. Reduced motion keeps
// it still (it can still be pushed by hand).
"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type InfiniteSpiralItem = { src: string; alt: string };

export type InfiniteSpiralProps = {
  items: InfiniteSpiralItem[];
  /** Helix radius (px). */
  radius?: number;
  /** Vertical gap between neighbors (px). */
  spacing?: number;
  /** Items per full turn. */
  perTurn?: number;
  /** Items per second (negative goes down). */
  speed?: number;
  /** Card size (px). */
  cardWidth?: number;
  className?: string;
};

export function InfiniteSpiral({ items, radius = 260, spacing = 40, perTurn = 8, speed = 0.35, cardWidth = 150, className }: InfiniteSpiralProps) {
  const reduced = useReducedMotion();
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const s = useRef({ t: 0, v: 0, paused: false, drag: null as null | number });

  useEffect(() => {
    const n = items.length;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = s.current;
      if (!st.paused && !reduced && st.drag === null) st.t += speed * dt;
      st.t += st.v * dt;
      st.v *= 0.92;
      refs.current.forEach((el, i) => {
        if (!el) return;
        let p = (((i - st.t) % n) + n) % n;
        if (p >= n / 2) p -= n; // -n/2 .. n/2, centered on the middle
        const angle = (p / perTurn) * 360;
        const facing = Math.cos((angle * Math.PI) / 180);
        const edge = Math.min(1, (n / 2 - Math.abs(p)) / 1.5);
        el.style.transform = `translate(-50%, -50%) translateY(${-p * spacing}px) rotateY(${angle}deg) translateZ(${radius}px)`;
        el.style.opacity = String(Math.max(0, edge) * (0.35 + 0.65 * (facing + 1) / 2));
        el.style.zIndex = String(Math.round((facing + 1) * 50));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [items.length, perTurn, radius, spacing, speed, reduced]);

  const onKeyDown = (event: KeyboardEvent) => {
    const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
    if (!dir) return;
    event.preventDefault();
    s.current.v += dir * 4;
  };

  return (
    <div
      tabIndex={0}
      role="group"
      aria-roledescription="spiral gallery"
      aria-label="Image spiral. Arrow keys turn it."
      onKeyDown={onKeyDown}
      onPointerEnter={() => (s.current.paused = true)}
      onPointerLeave={() => (s.current.paused = false)}
      onFocus={() => (s.current.paused = true)}
      onBlur={() => (s.current.paused = false)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        s.current.drag = e.clientX;
      }}
      onPointerMove={(e) => {
        const st = s.current;
        if (st.drag === null) return;
        const dx = e.clientX - st.drag;
        st.drag = e.clientX;
        st.t -= dx / 60;
        st.v = -dx * 2;
      }}
      onPointerUp={() => (s.current.drag = null)}
      className={cn("pl-focus-ring relative h-[32rem] cursor-grab touch-pan-y overflow-hidden rounded-3xl select-none [perspective:1100px] active:cursor-grabbing", className)}
    >
      <div className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: `translateZ(${-radius}px) rotateX(-8deg)` }}>
        {items.map((item, i) => (
          <div
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="absolute top-1/2 left-1/2 aspect-[4/5] overflow-hidden rounded-2xl bg-fill shadow-[var(--pl-shadow-lg)] will-change-transform"
            style={{ width: cardWidth }}
          >
            <img src={item.src} alt={item.alt} draggable={false} className="size-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
