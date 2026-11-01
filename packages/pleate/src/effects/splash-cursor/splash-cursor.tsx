// SplashCursor: moving the cursor stirs up soft clouds of color that keep the push of the stroke, swirl, spread and
// fade, like dye in water. It is a light canvas imitation of a fluid, not a fluid solver. It stays inside its own
// box (or the page with `fullPage`), only reacts to a mouse or pen and keeps the system cursor. Touch screens and
// reduced motion get the plain children.
"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { cssColorToRgb } from "../shader/shader.tsx";

export type SplashCursorProps = HTMLAttributes<HTMLDivElement> & {
  /** Dye colors (CSS, tokens allowed). Leave empty for a slowly shifting rainbow. */
  colors?: string[];
  /** Puff size multiplier. */
  size?: number;
  /** How long the dye lasts (s). */
  lifetime?: number;
  /** Softness of the clouds (CSS blur, px). */
  blur?: number;
  /** Track the pointer over the whole page instead of this box. */
  fullPage?: boolean;
};

type Puff = { x: number; y: number; vx: number; vy: number; r: number; age: number; spin: number; rgb: string };

export function SplashCursor({ colors, size = 1, lifetime = 1.6, blur = 10, fullPage = false, className, children, ...props }: SplashCursorProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const on = fine && !reduced;
  const key = colors?.join("|") ?? "";

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!on || !canvas || !ctx) return;
    let palette: string[] = [];
    const readColors = () => (palette = key ? key.split("|").map((c) => cssColorToRgb(c, canvas).map((v) => Math.round(v * 255)).join(" ")) : []);
    readColors();
    const themeWatch = new MutationObserver(readColors);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "style", "class"] });

    const puffs: Puff[] = [];
    let last: { x: number; y: number } | null = null;
    let hue = Math.random() * 360;
    let pick = 0;
    let frame = 0;
    let prev = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.age += dt / lifetime;
        if (p.age >= 1) {
          puffs.splice(i, 1);
          continue;
        }
        // Velocity slowly turns (the swirl) and dies out; the cloud spreads as it slows.
        const c = Math.cos(p.spin * dt), s = Math.sin(p.spin * dt);
        [p.vx, p.vy] = [(p.vx * c - p.vy * s) * (1 - 2.2 * dt), (p.vx * s + p.vy * c) * (1 - 2.2 * dt)];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += dt * 40 * size;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        const a = 0.5 * (1 - p.age) ** 1.5;
        g.addColorStop(0, `rgb(${p.rgb} / ${a})`);
        g.addColorStop(1, `rgb(${p.rgb} / 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      frame = puffs.length ? requestAnimationFrame(draw) : 0;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const dx = last ? x - last.x : 0, dy = last ? y - last.y : 0;
      last = { x, y };
      const speed = Math.hypot(dx, dy);
      if (speed < 1 || puffs.length > 400) return;
      hue = (hue + speed * 0.15) % 360;
      const rgb = palette.length ? palette[pick++ % palette.length] : hslToRgb(hue);
      for (let i = 0; i < 3; i++) {
        puffs.push({
          x, y,
          vx: dx * 9 + (Math.random() - 0.5) * 60,
          vy: dy * 9 + (Math.random() - 0.5) * 60,
          r: (14 + Math.min(speed, 40) * 0.8) * size,
          age: 0,
          spin: (Math.random() - 0.5) * 6,
          rgb,
        });
      }
      if (!frame) {
        prev = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };
    const onLeave = () => (last = null);
    const host: HTMLElement | Window = fullPage ? window : (canvas.parentElement ?? canvas);
    host.addEventListener("pointermove", onMove as EventListener);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      themeWatch.disconnect();
      host.removeEventListener("pointermove", onMove as EventListener);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [on, key, size, lifetime, fullPage]);

  return (
    <div className={cn("relative", !fullPage && "overflow-hidden", className)} {...props}>
      {children}
      {on && (
        <canvas
          ref={ref}
          aria-hidden="true"
          className={cn("pointer-events-none inset-0 size-full", fullPage ? "fixed z-50" : "absolute")}
          style={{ filter: `blur(${blur}px) saturate(1.3)` }}
        />
      )}
    </div>
  );
}

function hslToRgb(h: number) {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (0.55 - 0.45 * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return `${f(0)} ${f(8)} ${f(4)}`;
}
