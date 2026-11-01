// WebThreads: drifting points spun together by fine threads whenever they come close. The pointer is a point too, and
// gently gathers the web around it.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (web-threads); own canvas 2D code.
"use client";

import { CanvasBackground, rgba, type BackgroundProps, type CanvasFrame } from "../background-kit/background-kit.tsx";

/** colors: [points, threads]. */
export type WebThreadsProps = BackgroundProps & {
  /** Points per 100,000 px² of area. */
  density?: number;
  /** Longest thread in px (times scale). */
  reach?: number;
};

type Node = { x: number; y: number; vx: number; vy: number };

export function WebThreads({ density = 9, reach = 120, ...props }: WebThreadsProps) {
  const draw = ({ ctx, width, height, dt, pointer, colors: [dotColor, threadColor], scale, store }: CanvasFrame) => {
    const s = store as { nodes?: Node[] };
    s.nodes ??= Array.from({ length: Math.round((width * height) / 100000 * density) }, () => ({
      x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 24, vy: (Math.random() - 0.5) * 24,
    }));
    const nodes = s.nodes, max = reach * scale;
    for (const n of nodes) {
      if (pointer.active > 0.05) {
        const dx = pointer.x - n.x, dy = pointer.y - n.y, d = Math.hypot(dx, dy);
        if (d < max * 1.5 && d > 1) {
          n.vx += (dx / d) * 30 * dt * pointer.active;
          n.vy += (dy / d) * 30 * dt * pointer.active;
        }
      }
      const v = Math.hypot(n.vx, n.vy);
      if (v > 30) { n.vx *= 30 / v; n.vy *= 30 / v; }
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
      n.x = Math.min(width, Math.max(0, n.x));
      n.y = Math.min(height, Math.max(0, n.y));
    }
    const all = pointer.active > 0.05 ? [...nodes, { x: pointer.x, y: pointer.y, vx: 0, vy: 0 }] : nodes;
    ctx.lineWidth = 1;
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const d = Math.hypot(all[i].x - all[j].x, all[i].y - all[j].y);
        if (d > max) continue;
        ctx.strokeStyle = rgba(threadColor, (1 - d / max) * 0.45);
        ctx.beginPath();
        ctx.moveTo(all[i].x, all[i].y);
        ctx.lineTo(all[j].x, all[j].y);
        ctx.stroke();
      }
    }
    ctx.fillStyle = rgba(dotColor, 0.85);
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  return <CanvasBackground defaults={["var(--pl-accent)", "var(--pl-fg)"]} draw={draw} {...props} />;
}
