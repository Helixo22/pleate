// GridMotion: a tilted wall of tiles in rows that slide sideways with the pointer, each row with its own lag and
// direction, drifting gently on their own. DOM tiles, so pass any content (text, images). Fills its parent,
// decorative (aria-hidden), pauses off screen, still for reduced motion.
"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import type { BackgroundProps } from "../background-kit/background-kit.tsx";

export type GridMotionProps = BackgroundProps & {
  /** Tile contents, reused in order to fill the grid. Empty tiles when omitted. */
  items?: ReactNode[];
  /** Number of rows. */
  rows?: number;
  /** Tiles per row. */
  columns?: number;
  /** Tilt of the wall in degrees. */
  angle?: number;
};

/** Colors: tile fill and backdrop (default: fill and accent soft tokens). Speed scales the drift, scale the tiles. */
export function GridMotion({ items, rows = 4, columns = 7, angle = -12, colors, speed = 1, scale = 1, interactive = true, className, style }: GridMotionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = useReducedMotion();
  const live = useRef(speed);
  live.current = speed;

  useEffect(() => {
    const root = ref.current;
    const host = root?.parentElement;
    if (!root || !host || reduced) return;
    let target = 0;
    const offsets = rowRefs.current.map(() => 0);
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      target = (e.clientX - r.left) / r.width - 0.5;
    };
    const onLeave = () => (target = 0);
    if (interactive) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
    }
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(root);
    let frame = 0, time = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      frame = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      time += dt * live.current;
      const width = root.clientWidth;
      rowRefs.current.forEach((row, i) => {
        if (!row) return;
        const dir = i % 2 ? -1 : 1;
        const goal = dir * (target * width * 0.25 + Math.sin(time * 0.3 + i) * 24);
        // Later rows lag more.
        offsets[i] += (goal - offsets[i]) * (1 - Math.exp(-dt * (4 - i * 0.5)));
        row.style.transform = `translate3d(${offsets[i]}px,0,0)`;
      });
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [interactive, reduced, rows]);

  const vars = { "--gm-tile": colors?.[0] ?? "var(--pl-fill-2)", "--gm-back": colors?.[1] ?? "var(--pl-accent-soft)" } as CSSProperties;
  return (
    <div ref={ref} aria-hidden="true" className={cn("pointer-events-none relative size-full overflow-hidden", className)} style={{ ...vars, background: "radial-gradient(ellipse at center, var(--gm-back), transparent 75%)", ...style }}>
      <div className="absolute top-1/2 left-1/2 flex w-[160%] flex-col gap-3" style={{ transform: `translate(-50%,-50%) rotate(${angle}deg)` }}>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} ref={(el) => void (rowRefs.current[r] = el)} className="flex gap-3 will-change-transform">
            {Array.from({ length: columns }, (_, c) => {
              const item = items?.length ? items[(r * columns + c) % items.length] : null;
              return (
                <div key={c} className="grid flex-1 place-items-center overflow-hidden rounded-xl text-headline text-fg-muted" style={{ background: "var(--gm-tile)", height: 120 * scale }}>
                  {item}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
