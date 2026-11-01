// PixelTrail: the cursor lights up square pixels on a grid that fade out behind it. It stays inside its own box
// (or covers the page with `fullPage`), only reacts to a mouse or pen, and leaves the system cursor alone. Touch
// screens and reduced motion get the plain children.
"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { cssColorToRgb } from "../shader/shader.tsx";

export type PixelTrailProps = HTMLAttributes<HTMLDivElement> & {
  /** Pixel size (px). */
  gridSize?: number;
  /** How long a pixel takes to fade (ms). */
  duration?: number;
  /** Pixel color (CSS, tokens allowed). */
  color?: string;
  /** Pixel corner radius as a fraction of the size (0 square, 0.5 round). */
  roundness?: number;
  /** Track the pointer over the whole page instead of this box. */
  fullPage?: boolean;
};

export function PixelTrail({ gridSize = 24, duration = 600, color = "var(--pl-accent)", roundness = 0.15, fullPage = false, className, children, ...props }: PixelTrailProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const on = fine && !reduced;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!on || !canvas || !ctx) return;
    let fill = "";
    const readColor = () => (fill = `rgb(${cssColorToRgb(color, canvas).map((v) => Math.round(v * 255)).join(" ")})`);
    readColor();
    const themeWatch = new MutationObserver(readColor);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "style", "class"] });

    const lit = new Map<string, number>();
    let last: { x: number; y: number } | null = null;
    let frame = 0;
    const draw = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = fill;
      for (const [key, born] of lit) {
        const t = (now - born) / duration;
        if (t >= 1) {
          lit.delete(key);
          continue;
        }
        const [cx, cy] = key.split(",").map(Number);
        const s = gridSize * (1 - t * 0.35);
        ctx.globalAlpha = 1 - t;
        ctx.beginPath();
        ctx.roundRect(cx * gridSize + (gridSize - s) / 2, cy * gridSize + (gridSize - s) / 2, s, s, s * roundness);
        ctx.fill();
      }
      frame = lit.size ? requestAnimationFrame(draw) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = canvas.getBoundingClientRect();
      const p = { x: e.clientX - r.left, y: e.clientY - r.top };
      // Fill the gap between two events so fast moves still leave a continuous trail.
      const from = last ?? p;
      const steps = Math.max(1, Math.ceil(Math.hypot(p.x - from.x, p.y - from.y) / (gridSize / 2)));
      for (let i = 1; i <= steps; i++) {
        const x = from.x + ((p.x - from.x) * i) / steps, y = from.y + ((p.y - from.y) * i) / steps;
        if (x >= 0 && y >= 0 && x <= r.width && y <= r.height) lit.set(`${Math.floor(x / gridSize)},${Math.floor(y / gridSize)}`, performance.now());
      }
      last = p;
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onLeave = () => (last = null);
    const target: HTMLElement | Window = fullPage ? window : (canvas.parentElement ?? canvas);
    target.addEventListener("pointermove", onMove as EventListener);
    target.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      themeWatch.disconnect();
      target.removeEventListener("pointermove", onMove as EventListener);
      target.removeEventListener("pointerleave", onLeave);
    };
  }, [on, gridSize, duration, color, roundness, fullPage]);

  return (
    <div className={cn("relative", className)} {...props}>
      {children}
      {on && <canvas ref={ref} aria-hidden="true" className={cn("pointer-events-none inset-0 size-full", fullPage ? "fixed z-50" : "absolute")} />}
    </div>
  );
}
