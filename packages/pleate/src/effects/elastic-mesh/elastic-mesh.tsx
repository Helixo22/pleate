// ElasticMesh: a wire grid that bends away from the cursor and springs back, with a ripple on click. Drawn on a
// canvas behind the content of its container. Touch and reduced motion get the still grid.
"use client";

import { useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useCanvasLoop, useFinePointer, useHostPointer, useRgb } from "../cursor-kit/cursor-kit.ts";

export type ElasticMeshProps = HTMLAttributes<HTMLDivElement> & {
  /** Distance between grid points in px. */
  gap?: number;
  /** Reach of the cursor in px. */
  radius?: number;
  /** How hard the cursor pushes. */
  strength?: number;
  /** Line color (CSS). */
  color?: string;
};

type Node = { ox: number; oy: number; x: number; y: number; vx: number; vy: number };

export function ElasticMesh({ gap = 32, radius = 110, strength = 1, color = "var(--pl-separator)", className, children, ...props }: ElasticMeshProps) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const active = useFinePointer();
  const rgb = useRgb(color, host);
  const mesh = useRef({ cols: 0, rows: 0, nodes: [] as Node[], w: 0, h: 0 });
  const p = useRef({ x: -1e4, y: -1e4 });

  const wake = useCanvasLoop(canvas, (ctx, w, h, dt) => {
    const m = mesh.current;
    if (m.w !== w || m.h !== h) {
      m.cols = Math.ceil(w / gap) + 1;
      m.rows = Math.ceil(h / gap) + 1;
      m.nodes = [];
      for (let j = 0; j < m.rows; j++) for (let i = 0; i < m.cols; i++) m.nodes.push({ ox: i * gap, oy: j * gap, x: i * gap, y: j * gap, vx: 0, vy: 0 });
      Object.assign(m, { w, h });
    }
    let energy = 0;
    const step = Math.min(dt, 1 / 30) * 60;
    for (const n of m.nodes) {
      const dx = n.x - p.current.x, dy = n.y - p.current.y;
      const d = Math.hypot(dx, dy);
      if (d < radius && d > 0.01) {
        const f = (1 - d / radius) ** 2 * 2.2 * strength;
        n.vx += (dx / d) * f * step;
        n.vy += (dy / d) * f * step;
      }
      n.vx = (n.vx + (n.ox - n.x) * 0.08 * step) * 0.82;
      n.vy = (n.vy + (n.oy - n.y) * 0.08 * step) * 0.82;
      n.x += n.vx * step;
      n.y += n.vy * step;
      energy += Math.abs(n.vx) + Math.abs(n.vy) + Math.abs(n.x - n.ox) + Math.abs(n.y - n.oy);
    }
    ctx.clearRect(0, 0, w, h);
    const [r, g, b] = rgb ?? [128, 128, 128];
    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const at = (i: number, j: number) => m.nodes[j * m.cols + i];
    for (let j = 0; j < m.rows; j++) for (let i = 0; i < m.cols; i++) {
      const n = at(i, j);
      if (i + 1 < m.cols) { ctx.moveTo(n.x, n.y); ctx.lineTo(at(i + 1, j).x, at(i + 1, j).y); }
      if (j + 1 < m.rows) { ctx.moveTo(n.x, n.y); ctx.lineTo(at(i, j + 1).x, at(i, j + 1).y); }
    }
    ctx.stroke();
    return energy > 0.5 || p.current.x > -1e3;
  });

  useHostPointer(
    host,
    {
      move: (x, y) => {
        p.current = { x, y };
        wake();
      },
      leave: () => {
        p.current = { x: -1e4, y: -1e4 };
        wake();
      },
      down: (x, y) => {
        // Ripple: one outward kick for every node within reach of the click.
        for (const n of mesh.current.nodes) {
          const dx = n.ox - x, dy = n.oy - y, d = Math.hypot(dx, dy);
          if (d > 0.01 && d < radius * 2.5) {
            const f = 9 * strength * (1 - d / (radius * 2.5));
            n.vx += (dx / d) * f;
            n.vy += (dy / d) * f;
          }
        }
        wake();
      },
    },
    false,
    active,
  );

  return (
    <div ref={host} className={cn("relative isolate overflow-hidden", className)} {...props}>
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[1] size-full" />
      {children}
    </div>
  );
}
