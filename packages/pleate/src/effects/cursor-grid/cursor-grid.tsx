// CursorGrid: a field of dots that swell and take the accent color near the cursor, then settle back. Drawn on a
// canvas behind the content of its container. Touch and reduced motion get the still grid.
"use client";

import { useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useCanvasLoop, useFinePointer, useHostPointer, useRgb } from "../cursor-kit/cursor-kit.ts";

export type CursorGridProps = HTMLAttributes<HTMLDivElement> & {
  /** Distance between dots in px. */
  gap?: number;
  /** Resting dot radius in px. */
  dotSize?: number;
  /** Reach of the cursor in px. */
  radius?: number;
  /** Resting dot color (CSS). */
  color?: string;
  /** Color near the cursor (CSS). */
  activeColor?: string;
};

export function CursorGrid({ gap = 22, dotSize = 1.4, radius = 120, color = "var(--pl-fg-subtle)", activeColor = "var(--pl-accent)", className, children, ...props }: CursorGridProps) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const active = useFinePointer();
  const base = useRgb(color, host);
  const hot = useRgb(activeColor, host);
  const p = useRef({ x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, on: 0, ton: 0 });

  const wake = useCanvasLoop(canvas, (ctx, w, h, dt) => {
    const s = p.current;
    const k = 1 - Math.exp(-dt * 14);
    s.x += (s.tx - s.x) * k;
    s.y += (s.ty - s.y) * k;
    s.on += (s.ton - s.on) * (1 - Math.exp(-dt * 6));
    ctx.clearRect(0, 0, w, h);
    const [r0, g0, b0] = base ?? [128, 128, 128];
    const [r1, g1, b1] = hot ?? [0, 122, 255];
    const ox = (w % gap) / 2, oy = (h % gap) / 2;
    for (let x = ox; x <= w; x += gap) {
      for (let y = oy; y <= h; y += gap) {
        const d = Math.hypot(x - s.x, y - s.y);
        const t = s.on * Math.max(0, 1 - d / radius) ** 2;
        ctx.fillStyle = `rgba(${Math.round(r0 + (r1 - r0) * t)},${Math.round(g0 + (g1 - g0) * t)},${Math.round(b0 + (b1 - b0) * t)},${0.55 + 0.45 * t})`;
        ctx.beginPath();
        ctx.arc(x, y, dotSize * (1 + t * 1.8), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) > 0.3 || Math.abs(s.ton - s.on) > 0.01;
  });

  useHostPointer(
    host,
    {
      move: (x, y) => {
        const s = p.current;
        if (s.on < 0.01) Object.assign(s, { x, y });
        Object.assign(s, { tx: x, ty: y, ton: 1 });
        wake();
      },
      leave: () => {
        p.current.ton = 0;
        wake();
      },
    },
    false,
    active,
  );

  return (
    <div ref={host} className={cn("relative isolate", className)} {...props}>
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[1] size-full rounded-[inherit]" />
      {children}
    </div>
  );
}
