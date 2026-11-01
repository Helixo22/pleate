// SwarmCursor: a cloud of small particles that flocks after the cursor, overshoots, and drifts around it when it
// stops. It stays inside its own box (or the page with `fullPage`), only reacts to a mouse or pen and keeps the
// system cursor. Touch screens and reduced motion get the plain children.
"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { cssColorToRgb } from "../shader/shader.tsx";

export type SwarmCursorProps = HTMLAttributes<HTMLDivElement> & {
  /** Number of particles. */
  count?: number;
  /** Particle color (CSS, tokens allowed). */
  color?: string;
  /** Particle radius (px). */
  size?: number;
  /** How hard particles are pulled to the cursor. */
  attraction?: number;
  /** Track the pointer over the whole page instead of this box. */
  fullPage?: boolean;
};

export function SwarmCursor({ count = 60, color = "var(--pl-accent)", size = 2.5, attraction = 1, fullPage = false, className, children, ...props }: SwarmCursorProps) {
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

    const target = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 };
    const bugs = Array.from({ length: count }, () => ({
      x: target.x + (Math.random() - 0.5) * 200,
      y: target.y + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
      // Each particle has its own pull and preferred orbit so the swarm never collapses to a point.
      pull: (0.6 + Math.random() * 0.8) * attraction,
      orbit: 10 + Math.random() * 40,
      phase: Math.random() * Math.PI * 2,
    }));
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
    const draw = (now: number) => {
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
      ctx.fillStyle = fill;
      const t = now / 1000;
      for (const b of bugs) {
        const gx = target.x + Math.cos(t * 1.3 + b.phase) * b.orbit;
        const gy = target.y + Math.sin(t * 1.7 + b.phase) * b.orbit;
        b.vx = (b.vx + (gx - b.x) * 0.004 * b.pull) * 0.94;
        b.vy = (b.vy + (gy - b.y) * 0.004 * b.pull) * 0.94;
        b.x += b.vx;
        b.y += b.vy;
        const speed = Math.min(Math.hypot(b.vx, b.vy) / 6, 1);
        ctx.globalAlpha = 0.45 + speed * 0.55;
        ctx.beginPath();
        ctx.arc(b.x, b.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
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
  }, [on, count, color, size, attraction, fullPage]);

  return (
    <div className={cn("relative", !fullPage && "overflow-hidden", className)} {...props}>
      {children}
      {on && <canvas ref={ref} aria-hidden="true" className={cn("pointer-events-none inset-0 size-full", fullPage ? "fixed z-50" : "absolute")} />}
    </div>
  );
}
