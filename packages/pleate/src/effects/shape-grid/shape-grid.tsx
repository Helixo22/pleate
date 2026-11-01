// ShapeGrid: a grid of outlined shapes drifting diagonally. Cells under the pointer fill in and fade out behind it,
// leaving a trail.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (shape-grid); own canvas 2D code.
"use client";

import { CanvasBackground, rgba, type BackgroundProps, type CanvasFrame } from "../background-kit/background-kit.tsx";

export type GridShape = "square" | "circle" | "hexagon" | "triangle";

/** colors: [outline, hover fill]. */
export type ShapeGridProps = BackgroundProps & {
  shape?: GridShape;
  /** Cell size in px (times scale). */
  cell?: number;
};

function path(ctx: CanvasRenderingContext2D, shape: GridShape, cx: number, cy: number, r: number) {
  ctx.beginPath();
  if (shape === "circle") ctx.arc(cx, cy, r, 0, Math.PI * 2);
  else if (shape === "square") ctx.rect(cx - r, cy - r, r * 2, r * 2);
  else {
    const n = shape === "hexagon" ? 6 : 3;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / n;
      ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath();
  }
}

export function ShapeGrid({ shape = "square", cell = 44, ...props }: ShapeGridProps) {
  const draw = ({ ctx, width, height, time, dt, pointer, colors: [line, fill], scale, store }: CanvasFrame) => {
    const s = store as { heat?: Map<string, number> };
    const heat = (s.heat ??= new Map());
    const size = cell * scale;
    const shift = time * 14;
    const ox = shift % size, oy = shift % size;
    // Grid index under the pointer, in drifting grid coordinates.
    if (pointer.active > 0.5) {
      const key = `${Math.floor((pointer.x + shift) / size)},${Math.floor((pointer.y + shift) / size)}`;
      heat.set(key, 1);
    }
    const r = size * (shape === "square" ? 0.5 : 0.44);
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(line, 0.18);
    for (let x = -ox - size; x < width + size; x += size) {
      for (let y = -oy - size; y < height + size; y += size) {
        const cx = x + size / 2, cy = y + size / 2;
        const h = heat.get(`${Math.round((x + shift) / size)},${Math.round((y + shift) / size)}`);
        path(ctx, shape, cx, cy, r);
        if (h) {
          ctx.fillStyle = rgba(fill, h * 0.6);
          ctx.fill();
        }
        ctx.stroke();
      }
    }
    for (const [k, v] of heat) {
      const next = v - dt * 1.5;
      if (next <= 0) heat.delete(k);
      else heat.set(k, next);
    }
  };
  return <CanvasBackground defaults={["var(--pl-fg)", "var(--pl-accent)"]} draw={draw} {...props} />;
}
