// Lanyard: a badge hanging from a strap. The strap is a small verlet rope (points, gravity, distance constraints);
// grab the card and throw it, or focus it and press the arrow keys to give it a swing. The simulation sleeps when
// the badge comes to rest. Reduced motion shows it hanging still.
"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type LanyardProps = {
  /** Badge content. */
  children: ReactNode;
  /** Accessible name of the badge. */
  label?: string;
  /** Strap length (px). */
  length?: number;
  /** Badge size (px). */
  width?: number;
  height?: number;
  /** Strap color (CSS). */
  strapColor?: string;
  className?: string;
};

type P = { x: number; y: number; px: number; py: number };
const SEGMENTS = 14;
const GRAVITY = 1600; // px/s²
const DT = 1 / 60;

export function Lanyard({ children, label = "Badge", length = 190, width = 210, height = 290, strapColor = "var(--pl-accent)", className }: LanyardProps) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const wake = useRef(() => {});
  const sim = useRef({ pts: [] as P[], drag: null as null | { x: number; y: number; ox: number; oy: number }, raf: 0, still: 0 });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const seg = length / SEGMENTS;
    const s = sim.current;
    const ax = () => el.clientWidth / 2;
    s.pts = Array.from({ length: SEGMENTS + 1 }, (_, i) => ({ x: ax() + i * 2, y: i * seg, px: ax() + i * 2, py: i * seg }));

    const draw = () => {
      const pts = s.pts;
      if (path.current) path.current.setAttribute("d", "M" + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L"));
      const a = pts[SEGMENTS], b = pts[SEGMENTS - 5]; // a few links back: one slack link points anywhere
      const angle = -Math.atan2(a.x - b.x, a.y - b.y);
      if (card.current) card.current.style.transform = `translate(${a.x - width / 2}px, ${a.y}px) rotate(${angle}rad)`;
    };

    const step = () => {
      const pts = s.pts;
      pts[0].x = pts[0].px = ax();
      pts[0].y = pts[0].py = 0;
      let energy = 0;
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        let vx = (p.x - p.px) * 0.98, vy = (p.y - p.py) * 0.98;
        const sp = Math.hypot(vx, vy);
        if (sp > 22) (vx *= 22 / sp), (vy *= 22 / sp); // cap throws so the badge cannot loop over the hook
        energy += vx * vx + vy * vy;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + GRAVITY * DT * DT;
      }
      const end = pts[SEGMENTS];
      for (let k = 0; k < 24; k++) {
        if (s.drag) (end.x = s.drag.x - s.drag.ox), (end.y = s.drag.y - s.drag.oy);
        for (let i = 0; i < SEGMENTS; i++) {
          const a = pts[i], b = pts[i + 1];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d <= seg) continue; // a strap goes slack, it does not push
          const ia = i === 0 ? 0 : 1, ib = i + 1 === SEGMENTS && s.drag ? 0 : 1;
          const f = (d - seg) / d / (ia + ib || 1);
          a.x += dx * f * ia;
          a.y += dy * f * ia;
          b.x -= dx * f * ib;
          b.y -= dy * f * ib;
        }
      }
      draw();
      s.still = energy < 0.002 && !s.drag ? s.still + 1 : 0;
      s.raf = s.still > 30 ? 0 : requestAnimationFrame(step);
    };
    const settle = () => {
      for (let i = 0; i < 400; i++) {
        // Pre-run off screen so it mounts already hanging.
        const pts = s.pts;
        for (let j = 1; j < pts.length; j++) (pts[j].py = pts[j].y), (pts[j].y += GRAVITY * DT * DT * 4);
        for (let k = 0; k < 10; k++)
          for (let j = 0; j < SEGMENTS; j++) {
            const a = pts[j], b = pts[j + 1];
            const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
            if (d <= seg) continue;
            const f = (d - seg) / d;
            if (j > 0) (a.x += dx * f * 0.5), (a.y += dy * f * 0.5), (b.x -= dx * f * 0.5), (b.y -= dy * f * 0.5);
            else (b.x -= dx * f), (b.y -= dy * f);
          }
      }
      s.pts.forEach((p) => ((p.px = p.x), (p.py = p.y)));
    };
    settle();
    draw();
    wake.current = () => {
      if (!s.raf && !reduced) s.raf = requestAnimationFrame(step);
      s.still = 0;
    };
    if (!reduced) wake.current();
    const ro = new ResizeObserver(() => (reduced ? draw() : wake.current()));
    ro.observe(el);
    return () => {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      ro.disconnect();
    };
  }, [length, width, reduced]);

  const local = (x: number, y: number) => {
    const r = box.current!.getBoundingClientRect();
    return { x: x - r.left, y: y - r.top };
  };
  const push = (vx: number, vy: number) => {
    if (reduced) return;
    sim.current.pts.forEach((p, i) => {
      p.px -= (vx * i) / SEGMENTS;
      p.py -= (vy * i) / SEGMENTS;
    });
    wake.current();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const v = { ArrowLeft: [-14, 0], ArrowRight: [14, 0], ArrowUp: [0, -18], ArrowDown: [0, 8] }[event.key];
    if (!v) return;
    event.preventDefault();
    push(v[0], v[1]);
  };

  return (
    <div ref={box} className={cn("relative h-[34rem] w-full touch-none overflow-hidden select-none", className)}>
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <path ref={path} fill="none" stroke={strapColor} strokeWidth="14" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div
        ref={card}
        tabIndex={0}
        role="group"
        aria-roledescription="draggable badge"
        aria-label={`${label}. Drag it, or use the arrow keys to swing it.`}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          if (reduced) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = local(e.clientX, e.clientY);
          const end = sim.current.pts[SEGMENTS];
          sim.current.drag = { ...p, ox: p.x - end.x, oy: p.y - end.y };
          wake.current();
        }}
        onPointerMove={(e) => {
          const d = sim.current.drag;
          if (d) Object.assign(d, local(e.clientX, e.clientY));
        }}
        onPointerUp={() => (sim.current.drag = null)}
        onDragStart={(e) => e.preventDefault()}
        onPointerCancel={() => (sim.current.drag = null)}
        className="pl-focus-ring absolute top-0 left-0 origin-top cursor-grab active:cursor-grabbing"
        style={{ width, height }}
      >
        <div aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-12 -translate-x-1/2 rounded-md bg-[linear-gradient(#d4d4d8,#71717a)] shadow-[var(--pl-shadow-sm)]" />
        <div className="size-full overflow-hidden rounded-3xl bg-surface shadow-[var(--pl-shadow-xl)] ring-1 ring-black/5">{children}</div>
      </div>
    </div>
  );
}
