// PixelCard: a card that fills with shimmering pixels when hovered or focused. Pixels light up in a wave from the
// center outward and drain away when the pointer leaves. Drawn on a 2D canvas behind the content; reduced motion
// shows no pixels.
"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { cssColorToRgb } from "../shader/shader.tsx";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type PixelCardProps = HTMLAttributes<HTMLDivElement> & {
  /** Distance between pixels (px). */
  gap?: number;
  /** Wave speed, 0 to 1. */
  speed?: number;
  /** Pixel colors (CSS). Defaults to accent tones. */
  colors?: string[];
};

type Px = { x: number; y: number; color: string; size: number; max: number; delay: number; t: number; dir: number };

export function PixelCard({ gap = 6, speed = 0.4, colors = ["var(--pl-accent)", "var(--pl-accent-300)", "var(--pl-accent-600)"], className, children, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props }: PixelCardProps) {
  const reduced = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const run = useRef<(on: boolean) => void>(() => {});

  useEffect(() => {
    const el = canvas.current, box = wrap.current;
    const ctx = el?.getContext("2d");
    if (!el || !box || !ctx || reduced) return;
    const rgb = colors.map((c) => `rgb(${cssColorToRgb(c, box).map((v) => Math.round(v * 255)).join(" ")})`);
    let pixels: Px[] = [];
    let raf = 0;
    let target = 0;
    const build = () => {
      const w = box.clientWidth, h = box.clientHeight;
      const dpr = Math.min(2, devicePixelRatio);
      el.width = w * dpr;
      el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pixels = [];
      for (let x = 0; x < w; x += gap)
        for (let y = 0; y < h; y += gap)
          pixels.push({ x, y, color: rgb[Math.floor(Math.random() * rgb.length)], size: 0, max: 0.5 + Math.random() * 1.5, delay: Math.hypot(x - w / 2, y - h / 2), t: Math.random() * 6, dir: 1 });
    };
    const frame = () => {
      ctx.clearRect(0, 0, el.width, el.height);
      let alive = false;
      const reach = target ? (performance.now() - start) * speed * 1.2 : Infinity;
      for (const p of pixels) {
        const want = target && p.delay < reach ? p.max : 0;
        p.size += (want - p.size) * 0.12 * (0.5 + speed);
        if (want) {
          p.t += 0.05 + speed * 0.1;
          p.size = Math.max(0, p.size + Math.sin(p.t) * 0.05);
        }
        if (p.size > 0.05) {
          alive = true;
          const s = p.size;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x + gap / 2 - s, p.y + gap / 2 - s, s * 2, s * 2);
        }
      }
      raf = alive || target ? requestAnimationFrame(frame) : 0;
    };
    let start = 0;
    build();
    run.current = (on) => {
      target = on ? 1 : 0;
      start = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const ro = new ResizeObserver(build);
    ro.observe(box);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      run.current = () => {};
    };
    // colors as a key: a new array each render must not rebuild
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gap, speed, reduced, colors.join()]);

  return (
    <div
      ref={wrap}
      onPointerEnter={(e) => (run.current(true), onPointerEnter?.(e))}
      onPointerLeave={(e) => (run.current(false), onPointerLeave?.(e))}
      onFocus={(e) => (run.current(true), onFocus?.(e))}
      onBlur={(e) => (run.current(false), onBlur?.(e))}
      className={cn("relative isolate overflow-hidden rounded-3xl bg-surface pl-field [--pl-field-border:var(--pl-separator)]", className)}
      {...props}
    >
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[1] size-full" />
      {children}
    </div>
  );
}
