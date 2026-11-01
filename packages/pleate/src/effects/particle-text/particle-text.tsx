// ParticleText: the text is made of small dots. They fly in to form the letters, scatter away from the pointer and
// spring back when it leaves. Colors come from the palette. Screen readers get the plain text; reduced motion
// draws the settled letters once.
"use client";

import { useEffect, useRef, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type ParticleTextProps = {
  text: string;
  as?: ElementType;
  /** Canvas height (px). */
  height?: number;
  /** Distance between sampled dots (px). Lower means more dots. */
  gap?: number;
  /** Dot radius (px). */
  size?: number;
  /** How far the pointer pushes dots (px). */
  radius?: number;
  /** Dot colors (CSS); each dot picks one. */
  colors?: string[];
  font?: string;
  className?: string;
};

type Dot = { x: number; y: number; tx: number; ty: number; vx: number; vy: number; c: number };

export function ParticleText({
  text,
  as: Tag = "div",
  height = 220,
  gap = 4,
  size = 1.6,
  radius = 80,
  colors = ["var(--pl-fg)", "var(--pl-accent)"],
  font = "800 100px system-ui, sans-serif",
  className,
}: ParticleTextProps) {
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const host = ref.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;
    let dots: Dot[] = [];
    let w = 0;
    let palette: string[] = [];
    const pointer = { x: -1e4, y: -1e4 };

    // Resolve CSS colors (vars included) to something canvas understands, through the canvas's own `color`.
    const resolve = () => {
      palette = colors.map((c) => {
        canvas.style.color = c;
        return getComputedStyle(canvas).color;
      });
    };

    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth;
      canvas.width = w * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const off = document.createElement("canvas");
      off.width = w;
      off.height = height;
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return;
      o.font = font;
      const k = Math.min((w * 0.9) / (o.measureText(text).width || 1), (height * 0.75) / 100);
      o.translate(w / 2, height / 2);
      o.scale(k, k);
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillText(text, 0, 0);
      const data = o.getImageData(0, 0, w, height).data;
      const next: Dot[] = [];
      for (let y = 0; y < height; y += gap)
        for (let x = 0; x < w; x += gap)
          if (data[(y * w + x) * 4 + 3] > 128) {
            const old = dots[next.length];
            next.push({
              x: old?.x ?? (reduced ? x : Math.random() * w),
              y: old?.y ?? (reduced ? y : Math.random() * height),
              tx: x,
              ty: y,
              vx: 0,
              vy: 0,
              c: next.length % palette.length,
            });
          }
      dots = next;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, height);
      for (let i = 0; i < palette.length; i++) {
        ctx.fillStyle = palette[i];
        ctx.beginPath();
        for (const d of dots) {
          if (d.c !== i) continue;
          ctx.moveTo(d.x + size, d.y);
          ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    };

    const step = () => {
      for (const d of dots) {
        const dx = d.x - pointer.x;
        const dy = d.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < radius && dist > 0) {
          const push = (1 - dist / radius) * 6;
          d.vx += (dx / dist) * push;
          d.vy += (dy / dist) * push;
        }
        d.vx = (d.vx + (d.tx - d.x) * 0.05) * 0.84;
        d.vy = (d.vy + (d.ty - d.y) * 0.05) * 0.84;
        d.x += d.vx;
        d.y += d.vy;
      }
    };

    let raf = 0;
    let visible = false;
    const loop = () => {
      step();
      draw();
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    resolve();
    const resize = new ResizeObserver(() => {
      layout();
      draw();
    });
    resize.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !reduced;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(host);
    // Palette or theme switches change the CSS vars without re-rendering us.
    const themes = new MutationObserver(() => {
      resolve();
      draw();
    });
    themes.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-palette"] });

    const move = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer.x = e.clientX - box.left;
      pointer.y = e.clientY - box.top;
    };
    const leave = () => {
      pointer.x = pointer.y = -1e4;
    };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("pointerup", leave);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      io.disconnect();
      themes.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("pointerup", leave);
    };
    // colors is compared by value so inline arrays don't restart the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, height, gap, size, radius, colors.join(), font, reduced]);

  return (
    <Tag ref={ref} className={cn("block w-full", className)}>
      <span className="sr-only">{text}</span>
      <canvas ref={canvasRef} aria-hidden="true" className="block w-full" style={{ height }} />
    </Tag>
  );
}
