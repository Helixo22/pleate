// Ballpit: glossy balls piled up under gravity, bouncing off each other and the frame. The pointer shoves the balls
// it moves through. Simple 2D physics: gravity, wall bounce, pairwise collisions with a few relaxation passes.
// Canvas 2D (CanvasBackground), decorative, paused off screen, one still frame (already settled) for reduced motion.
"use client";

import { CanvasBackground, rgba, type BackgroundProps, type CanvasFrame } from "../background-kit/background-kit.tsx";

export type BallpitProps = BackgroundProps & {
  /** Number of balls. */
  count?: number;
  /** Gravity in px/s². Zero lets them float. */
  gravity?: number;
  /** Bounciness, 0..1. */
  bounce?: number;
};

type Ball = { x: number; y: number; vx: number; vy: number; r: number; c: number };

function step(balls: Ball[], w: number, h: number, dt: number, gravity: number, bounce: number, pointer: CanvasFrame["pointer"], push: { x: number; y: number }) {
  for (const b of balls) {
    b.vy += gravity * dt;
    // Pointer: a moving disc that hands its velocity to balls it overlaps.
    const dx = b.x - pointer.x, dy = b.y - pointer.y;
    const d = Math.hypot(dx, dy) || 1;
    const reach = b.r + 40;
    if (pointer.active > 0.5 && d < reach) {
      const k = (reach - d) / reach;
      b.vx += (dx / d) * 900 * k * dt + push.x * k * 0.3;
      b.vy += (dy / d) * 900 * k * dt + push.y * k * 0.3;
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < b.r) (b.x = b.r), (b.vx = Math.abs(b.vx) * bounce);
    if (b.x > w - b.r) (b.x = w - b.r), (b.vx = -Math.abs(b.vx) * bounce);
    if (b.y < b.r) (b.y = b.r), (b.vy = Math.abs(b.vy) * bounce);
    if (b.y > h - b.r) (b.y = h - b.r), (b.vy = -Math.abs(b.vy) * bounce), (b.vx *= 0.99);
  }
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i], b = balls[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const min = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
        const overlap = (min - d) / 2;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rel < 0) {
          const imp = (-(1 + bounce) * rel) / 2;
          a.vx -= imp * nx;
          a.vy -= imp * ny;
          b.vx += imp * nx;
          b.vy += imp * ny;
        }
      }
    }
  }
}

export function Ballpit({ count = 60, gravity = 900, bounce = 0.6, ...props }: BallpitProps) {
  const draw = ({ ctx, width, height, dt, pointer, colors, scale, store }: CanvasFrame) => {
    const balls = (store.balls ??= Array.from({ length: count }, (_, i) => {
      const r = (10 + Math.random() * 26) * scale * Math.min(1, Math.sqrt((width * height) / 400000) + 0.3);
      return { x: r + Math.random() * (width - 2 * r), y: Math.random() * height * 0.6, vx: (Math.random() - 0.5) * 200, vy: 0, r, c: i % colors.length };
    })) as Ball[];
    const last = (store.last ??= { x: pointer.x, y: pointer.y }) as { x: number; y: number };
    // Reduced motion gets dt 0: settle the pile once so the still frame is not mid air.
    const steps = dt === 0 && !store.settled ? 240 : dt > 0 ? 2 : 0;
    store.settled = true;
    const h = Math.min(dt, 1 / 30) / 2 || 1 / 60;
    const push = { x: (pointer.x - last.x) / Math.max(dt, 1 / 60), y: (pointer.y - last.y) / Math.max(dt, 1 / 60) };
    for (let s = 0; s < steps; s++) step(balls, width, height, h, gravity, bounce, pointer, push);
    last.x = pointer.x;
    last.y = pointer.y;
    for (const b of balls) {
      const c = colors[b.c];
      const g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.1, b.x, b.y, b.r);
      g.addColorStop(0, rgba(c.map((v) => v + (1 - v) * 0.6) as typeof c));
      g.addColorStop(0.45, rgba(c));
      g.addColorStop(1, rgba(c.map((v) => v * 0.45) as typeof c));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  return (
    <CanvasBackground
      defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) l c calc(h + 50))", "var(--pl-fg)", "color-mix(in srgb, var(--pl-accent) 45%, var(--pl-fg))"]}
      draw={draw}
      {...props}
    />
  );
}
