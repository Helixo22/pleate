// Ribbons: soft ribbons that chase the cursor on springs, each a little slower than the last, tapering towards the
// tail. It stays inside its own box (or the page with `fullPage`), only reacts to a mouse or pen and keeps the
// system cursor. Touch screens and reduced motion get the plain children.
"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { cssColorToRgb } from "../shader/shader.tsx";

export type RibbonsProps = HTMLAttributes<HTMLDivElement> & {
  /** One ribbon per color (CSS, tokens allowed). */
  colors?: string[];
  /** Width of the ribbon head (px). */
  thickness?: number;
  /** Points per ribbon: more is a longer tail. */
  length?: number;
  /** 0 to 1: how quickly the head catches the cursor. */
  ease?: number;
  /** Track the pointer over the whole page instead of this box. */
  fullPage?: boolean;
};

const DEFAULT_COLORS = ["var(--pl-accent)", "var(--pl-fg-muted)", "var(--pl-fg)"];

export function Ribbons({ colors = DEFAULT_COLORS, thickness = 18, length = 36, ease = 0.18, fullPage = false, className, children, ...props }: RibbonsProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const on = fine && !reduced;
  const key = colors.join("|");

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!on || !canvas || !ctx) return;
    const list = key.split("|");
    let fills: string[] = [];
    const readColors = () => (fills = list.map((c) => `rgb(${cssColorToRgb(c, canvas).map((v) => Math.round(v * 255)).join(" ")})`));
    readColors();
    const themeWatch = new MutationObserver(readColors);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "style", "class"] });

    const target = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 };
    const ribbons = list.map(() => Array.from({ length }, () => ({ ...target })));
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = canvas.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
    };
    let visible = true;
    const viewWatch = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    viewWatch.observe(canvas);

    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      if (!visible) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ribbons.forEach((points, i) => {
        const k = ease * (1 - i * 0.18);
        // Offset each ribbon a little so they fan out instead of stacking.
        points[0].x += (target.x + (i - (ribbons.length - 1) / 2) * 6 - points[0].x) * k;
        points[0].y += (target.y - points[0].y) * k;
        for (let p = 1; p < points.length; p++) {
          points[p].x += (points[p - 1].x - points[p].x) * 0.5;
          points[p].y += (points[p - 1].y - points[p].y) * 0.5;
        }
        ctx.strokeStyle = fills[i];
        ctx.globalAlpha = 0.85;
        // Short segments with shrinking width give the taper.
        for (let p = 1; p < points.length; p++) {
          ctx.lineWidth = thickness * (1 - p / points.length);
          ctx.beginPath();
          ctx.moveTo(points[p - 1].x, points[p - 1].y);
          ctx.lineTo(points[p].x, points[p].y);
          ctx.stroke();
        }
      });
    };
    frame = requestAnimationFrame(draw);
    const host: HTMLElement | Window = fullPage ? window : (canvas.parentElement ?? canvas);
    host.addEventListener("pointermove", onMove as EventListener);
    return () => {
      cancelAnimationFrame(frame);
      themeWatch.disconnect();
      viewWatch.disconnect();
      host.removeEventListener("pointermove", onMove as EventListener);
    };
  }, [on, key, thickness, length, ease, fullPage]);

  return (
    <div className={cn("relative", !fullPage && "overflow-hidden", className)} {...props}>
      {children}
      {on && <canvas ref={ref} aria-hidden="true" className={cn("pointer-events-none inset-0 size-full", fullPage ? "fixed z-50" : "absolute")} />}
    </div>
  );
}
