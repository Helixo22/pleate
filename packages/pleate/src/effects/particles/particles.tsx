// Particles: a slowly turning cloud of dots in 3D, near ones bigger and brighter. Moving the pointer tilts the cloud.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (particles); own canvas 2D code.
"use client";

import { CanvasBackground, rgba, type BackgroundProps, type CanvasFrame } from "../background-kit/background-kit.tsx";

/** colors: any number; each dot takes one of them. */
export type ParticlesProps = BackgroundProps & {
  /** Number of dots. */
  count?: number;
};

type Dot = { x: number; y: number; z: number; c: number };
type Store = { dots?: Dot[]; rx?: number; ry?: number };

export function Particles({ count = 360, colors, ...props }: ParticlesProps) {
  const defaults = colors?.length ? colors : ["var(--pl-accent)", "var(--pl-fg)", "var(--pl-info)"];
  const draw = ({ ctx, width, height, time, pointer, colors: rgb, scale, store }: CanvasFrame) => {
    const s = store as Store;
    if (!s.dots || s.dots.length !== count) {
      // Uniform points inside a unit sphere.
      s.dots = Array.from({ length: count }, (_, i) => {
        const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.cbrt(Math.random());
        const q = Math.sqrt(1 - u * u) * r;
        return { x: q * Math.cos(a), y: q * Math.sin(a), z: u * r, c: i % rgb.length };
      });
      s.rx = 0;
      s.ry = 0;
    }
    const tx = pointer.active * ((pointer.y / height) - 0.5) * 1.2;
    const ty = pointer.active * ((pointer.x / width) - 0.5) * 1.2;
    s.rx! += (tx - s.rx!) * 0.05;
    s.ry! += (ty - s.ry!) * 0.05;
    const ay = time * 0.12 + s.ry!, ax = s.rx!;
    const cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
    const radius = Math.max(width, height) * 0.55 * scale;
    for (const d of s.dots) {
      const x1 = d.x * cy + d.z * sy, z1 = -d.x * sy + d.z * cy;
      const y2 = d.y * cx - z1 * sx, z2 = d.y * sx + z1 * cx;
      const persp = 2 / (2.6 - z2);
      const px = width / 2 + x1 * radius * persp, py = height / 2 + y2 * radius * persp;
      ctx.fillStyle = rgba(rgb[d.c % rgb.length], 0.25 + 0.55 * (z2 + 1) / 2);
      ctx.beginPath();
      ctx.arc(px, py, (0.9 + 2.2 * persp) * Math.sqrt(scale), 0, Math.PI * 2);
      ctx.fill();
    }
  };
  return <CanvasBackground defaults={defaults} draw={draw} {...props} />;
}
