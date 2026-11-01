// HalftoneReveal: a screen of halftone dots covers the content; the dots shrink away under the cursor (or in a sweep
// when it scrolls into view) to reveal what is underneath, then slowly grow back. Touch and reduced motion get the
// content uncovered.
"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { useCanvasLoop, useFinePointer, useHostPointer, useRgb } from "../cursor-kit/cursor-kit.ts";

export type HalftoneRevealProps = HTMLAttributes<HTMLDivElement> & {
  /** "hover": the cursor wipes the dots away. "view": they sweep away once when the element scrolls into view. */
  trigger?: "hover" | "view";
  /** Distance between dots in px. */
  gap?: number;
  /** Reach of the cursor in px. */
  radius?: number;
  /** Dot color (CSS). */
  color?: string;
  /** How fast wiped dots grow back, per second (0 keeps them gone). */
  heal?: number;
};

export function HalftoneReveal({ trigger = "hover", gap = 12, radius = 90, color = "var(--pl-accent)", heal = 0.35, className, children, ...props }: HalftoneRevealProps) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  // Hover needs a mouse; the view sweep works on touch too.
  const active = trigger === "view" ? !reduced : fine;
  const rgb = useRgb(color, host);
  const field = useRef({ cols: 0, rows: 0, cut: new Float32Array(0), sweep: -1 });
  const p = useRef({ x: -1e4, y: -1e4 });

  const wake = useCanvasLoop(
    canvas,
    (ctx, w, h, dt) => {
      const f = field.current;
      const cols = Math.ceil(w / gap) + 1, rows = Math.ceil(h / gap) + 1;
      if (f.cols !== cols || f.rows !== rows) Object.assign(f, { cols, rows, cut: new Float32Array(cols * rows).fill(f.sweep >= 2.2 ? 1 : 0) });
      if (f.sweep >= 0) f.sweep += dt * 1.2;
      const [r, g, b] = rgb ?? [0, 122, 255];
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      let busy = f.sweep >= 0 && f.sweep < 2.2;
      
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = j * cols + i, x = i * gap, y = j * gap;
        let c = f.cut[k];
        const d = Math.hypot(x - p.current.x, y - p.current.y);
        if (d < radius) c = Math.max(c, (1 - d / radius) ** 0.6);
        if (f.sweep >= 0) c = Math.max(c, Math.min(1, (f.sweep * (w + h) - (x + y) * 0.9) / 120));
        else if (c > 0 && heal > 0) c = Math.max(0, c - heal * dt);
        f.cut[k] = c;
        if (c > 0 && c < 1) busy = true;
        // Dot size grows toward the bottom right, for the halftone gradient look.
        const rad = gap * (0.38 + 0.3 * ((x + y) / (w + h))) * (1 - c);
        if (rad < 0.3) continue;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      return busy || p.current.x > -1e3;
    },
    active,
  );

  useHostPointer(
    host,
    {
      move: (x, y) => {
        p.current = { x, y };
        wake();
      },
      leave: () => {
        p.current = { x: -1e4, y: -1e4 };
        wake();
      },
    },
    false,
    active && trigger === "hover",
  );

  useEffect(() => {
    const el = host.current;
    if (!el || !active || trigger !== "view") return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      field.current.sweep = 0;
      wake();
      io.disconnect();
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [active, trigger, wake]);

  return (
    <div ref={host} className={cn("relative overflow-hidden", className)} {...props}>
      {children}
      {active && <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />}
    </div>
  );
}
