// Antigravity: a field of small capsules that float slowly upward and wrap around. Near the pointer they are pulled
// onto a spinning ring around it, then drift off again when it leaves. Depth sets size and opacity.
// Canvas 2D (CanvasBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { CanvasBackground, rgba, type BackgroundProps, type CanvasFrame } from "../background-kit/background-kit.tsx";

export type AntigravityProps = BackgroundProps & {
  /** Particles per 10,000 px² of area. */
  density?: number;
  /** Radius of the ring around the pointer, in px. */
  ringRadius?: number;
};

type Particle = { x: number; y: number; z: number; vx: number; vy: number; seed: number };

export function Antigravity({ density = 2.2, ringRadius = 90, ...props }: AntigravityProps) {
  const draw = ({ ctx, width, height, dt, time, pointer, colors, scale, store }: CanvasFrame) => {
    const ps = (store.ps ??= Array.from({ length: Math.round((width * height * density) / 10000) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: 0.3 + Math.random() * 0.7,
      vx: 0,
      vy: 0,
      seed: Math.random() * 100,
    }))) as Particle[];
    const ring = ringRadius * scale;
    ctx.lineCap = "round";
    for (const p of ps) {
      const dx = p.x - pointer.x, dy = p.y - pointer.y;
      const dist = Math.hypot(dx, dy) || 1;
      const pull = pointer.active * Math.max(0, 1 - dist / (ring * 2.6));
      // Spring toward the ring plus a tangential push so the ring spins.
      const k = 14 * pull;
      p.vx += ((pointer.x + (dx / dist) * ring - p.x) * k - (dy / dist) * 60 * pull) * dt;
      p.vy += ((pointer.y + (dy / dist) * ring - p.y) * k + (dx / dist) * 60 * pull) * dt;
      // Lift and a little sway when free.
      p.vy += -18 * p.z * (1 - pull) * dt;
      p.vx += Math.sin(time * 0.8 + p.seed) * 6 * dt;
      const damp = Math.exp(-dt * (1.2 + 3 * pull));
      p.vx *= damp;
      p.vy *= damp;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y < -10) (p.y = height + 10), (p.x = Math.random() * width);
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      const angle = Math.atan2(p.vy, p.vx);
      const len = (3 + 6 * p.z) * scale;
      ctx.strokeStyle = rgba(pull > 0.2 ? colors[0] : colors[p.seed % 3 < 1 ? 0 : 1], 0.25 + 0.65 * p.z);
      ctx.lineWidth = (1.5 + 2 * p.z) * scale;
      ctx.beginPath();
      ctx.moveTo(p.x - Math.cos(angle) * len, p.y - Math.sin(angle) * len);
      ctx.lineTo(p.x + Math.cos(angle) * len, p.y + Math.sin(angle) * len);
      ctx.stroke();
    }
  };
  return <CanvasBackground defaults={["var(--pl-accent)", "var(--pl-fg)"]} draw={draw} {...props} />;
}
