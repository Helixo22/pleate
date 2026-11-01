// GhostCursor: the cursor leaves a pale, smoky trail that drifts up and fades out. Drawn on a canvas behind the
// content. It lives inside its container (or the whole page with `global`), ignores touch and reduced motion, and
// keeps the system cursor.
"use client";

import { useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useCanvasLoop, useFinePointer, useHostPointer, useRgb } from "../cursor-kit/cursor-kit.ts";

export type GhostCursorProps = HTMLAttributes<HTMLDivElement> & {
  /** Smoke color (CSS). */
  color?: string;
  /** Puff radius in px when it is born. */
  size?: number;
  /** Seconds a puff lives. */
  life?: number;
  /** 0 to 1: puff opacity. */
  opacity?: number;
  /** Follow the pointer across the whole page (fixed layer on top) instead of only this container. */
  global?: boolean;
};

type Puff = { x: number; y: number; age: number; seed: number };

export function GhostCursor({ color = "var(--pl-fg)", size = 22, life = 1.1, opacity = 0.35, global = false, className, children, ...props }: GhostCursorProps) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const active = useFinePointer();
  const rgb = useRgb(color, host);
  const puffs = useRef<Puff[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);

  const wake = useCanvasLoop(
    canvas,
    (ctx, w, h, dt) => {
      ctx.clearRect(0, 0, w, h);
      const [r, g, b] = rgb ?? [128, 128, 128];
      puffs.current = puffs.current.filter((p) => (p.age += dt) < life);
      for (const p of puffs.current) {
        const t = p.age / life;
        const x = p.x + Math.sin(p.seed + p.age * 3) * 6 * t;
        const y = p.y - 24 * t;
        const rad = size * (1 + t * 1.6);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
        grad.addColorStop(0, `rgba(${r},${g},${b},${opacity * (1 - t) ** 2})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      return puffs.current.length > 0;
    },
    active,
  );

  useHostPointer(
    host,
    {
      move: (x, y) => {
        const prev = last.current ?? { x, y };
        // One puff every few px so fast moves still leave a continuous trail.
        const steps = Math.min(12, Math.max(1, Math.floor(Math.hypot(x - prev.x, y - prev.y) / 8)));
        for (let i = 1; i <= steps; i++) {
          puffs.current.push({ x: prev.x + ((x - prev.x) * i) / steps, y: prev.y + ((y - prev.y) * i) / steps, age: 0, seed: Math.random() * 6.28 });
        }
        if (puffs.current.length > 240) puffs.current.splice(0, puffs.current.length - 240);
        last.current = { x, y };
        wake();
      },
      leave: () => (last.current = null),
    },
    global,
    active,
  );

  return (
    <div ref={host} className={cn("relative isolate", className)} {...props}>
      {active && <canvas ref={canvas} aria-hidden="true" className={cn("pointer-events-none", global ? "fixed inset-0 z-50 size-full" : "absolute inset-0 -z-[1] size-full rounded-[inherit]")} />}
      {children}
    </div>
  );
}
