// FallingText: a sentence whose words drop out of place and pile up at the bottom of the box, then can be picked
// up and thrown. Starts on view, click or hover. The physics is a small box solver (physics.ts). Screen readers
// get the sentence; reduced motion leaves the words where they are.
"use client";

import { useInView } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { step, type Body } from "./physics.ts";

export type FallingTextProps = {
  text: string;
  /** What starts the fall. */
  trigger?: "view" | "click" | "hover";
  /** Words to color with `highlightClassName`. */
  highlightWords?: string[];
  highlightClassName?: string;
  /** Box height (px); the floor is its bottom edge. */
  height?: number;
  className?: string;
  /** Classes for every word. */
  wordClassName?: string;
};

export function FallingText({
  text,
  trigger = "view",
  highlightWords = [],
  highlightClassName = "text-accent-ink",
  height = 260,
  className,
  wordClassName,
}: FallingTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const spans = useRef<(HTMLSpanElement | null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const drag = useRef<{ i: number; dx: number; dy: number; lx: number; ly: number; lt: number; vx: number; vy: number } | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  const [falling, setFalling] = useState(false);
  const words = text.split(/\s+/).filter(Boolean);
  const clean = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
  const highlight = new Set(highlightWords.map(clean));

  const start = () => {
    const box = ref.current;
    if (falling || reduced || !box) return;
    const origin = box.getBoundingClientRect();
    bodies.current = spans.current.map((s) => {
      const r = s!.getBoundingClientRect();
      return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height, vx: (Math.random() - 0.5) * 240, vy: 0 };
    });
    setFalling(true);
  };

  useEffect(() => {
    if (trigger === "view" && inView) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, inView]);

  // Layout effect: words switch to absolute positioning in the same frame they get their transforms.
  useLayoutEffect(() => {
    const box = ref.current;
    if (!falling || !box) return;
    const place = () =>
      bodies.current.forEach((b, i) => {
        const s = spans.current[i];
        if (s) s.style.transform = `translate(${b.x}px, ${b.y}px)`;
      });
    place();
    let raf = 0;
    let last = performance.now();
    let visible = true;
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      step(bodies.current, dt, box.clientWidth, box.clientHeight);
      place();
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(box);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [falling]);

  const down = (i: number) => (e: ReactPointerEvent<HTMLSpanElement>) => {
    const b = bodies.current[i];
    if (!falling || !b) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    b.held = true;
    drag.current = { i, dx: e.clientX - b.x, dy: e.clientY - b.y, lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0 };
  };
  const move = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const d = drag.current;
    if (!d) return;
    const b = bodies.current[d.i];
    const now = performance.now();
    const dt = Math.max(1, now - d.lt) / 1000;
    d.vx = (e.clientX - d.lx) / dt;
    d.vy = (e.clientY - d.ly) / dt;
    d.lx = e.clientX;
    d.ly = e.clientY;
    d.lt = now;
    b.x = e.clientX - d.dx;
    b.y = e.clientY - d.dy;
  };
  const up = () => {
    const d = drag.current;
    if (!d) return;
    const b = bodies.current[d.i];
    b.held = false;
    b.vx = Math.max(-2500, Math.min(2500, d.vx));
    b.vy = Math.max(-2500, Math.min(2500, d.vy));
    drag.current = null;
  };

  return (
    <div
      ref={ref}
      onClick={trigger === "click" ? start : undefined}
      onPointerEnter={trigger === "hover" ? start : undefined}
      className={cn("relative w-full overflow-hidden", trigger === "click" && !falling && "cursor-pointer", className)}
      style={{ height }}
    >
      <span className="sr-only">{text}</span>
      <div aria-hidden="true" className="flex flex-wrap content-start justify-center gap-y-1 p-4">
        {words.map((w, i) => (
          <span
            key={i}
            ref={(el) => {
              spans.current[i] = el;
            }}
            onPointerDown={down(i)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            className={cn(
              "inline-block px-[0.15em] whitespace-nowrap select-none",
              falling && "absolute top-0 left-0 cursor-grab touch-none active:cursor-grabbing",
              highlight.has(clean(w)) && highlightClassName,
              wordClassName,
            )}
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
