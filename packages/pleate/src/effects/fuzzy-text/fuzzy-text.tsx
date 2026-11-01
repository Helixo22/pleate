// FuzzyText: text on a canvas whose thin horizontal slices jitter sideways, like a bad signal; the noise grows while
// the pointer is over it. Font, size and weight come from the element's own CSS, so style it with classes.
// Screen readers get the plain text; reduced motion draws it clean.
"use client";

import { useEffect, useRef, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type FuzzyTextProps = {
  text: string;
  as?: ElementType;
  /** Jitter at rest, 0 to 1. */
  baseIntensity?: number;
  /** Jitter while hovered, 0 to 1. */
  hoverIntensity?: number;
  /** Text color (CSS). */
  color?: string;
  /** Slice height (px). */
  slice?: number;
  className?: string;
};

export function FuzzyText({ text, as: Tag = "span", baseIntensity = 0.15, hoverIntensity = 0.5, color = "var(--pl-fg)", slice = 2, className }: FuzzyTextProps) {
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const host = ref.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;
    const off = document.createElement("canvas");
    const o = off.getContext("2d");
    if (!o) return;
    let w = 0;
    let h = 0;
    let margin = 0;
    let dpr = 1;
    let hover = false;

    const layout = () => {
      const cs = getComputedStyle(host);
      const size = parseFloat(cs.fontSize);
      const font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.color = color;
      o.font = font;
      const m = o.measureText(text);
      margin = Math.ceil(size * 0.3);
      w = Math.ceil(m.width) + margin * 2;
      h = Math.ceil(size * 1.25);
      off.width = canvas.width = w * dpr;
      off.height = canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      o.setTransform(dpr, 0, 0, dpr, 0, 0);
      o.font = font;
      o.textBaseline = "middle";
      o.fillStyle = getComputedStyle(canvas).color;
      o.fillText(text, margin, h / 2);
    };

    const draw = (intensity: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const s = slice * dpr;
      for (let y = 0; y < off.height; y += s) {
        const dx = (Math.random() - 0.5) * 2 * intensity * margin * dpr;
        ctx.drawImage(off, 0, y, off.width, s, dx, y, off.width, s);
      }
    };

    let raf = 0;
    let visible = false;
    const loop = () => {
      draw(hover ? hoverIntensity : baseIntensity);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const refresh = () => {
      layout();
      draw(reduced ? 0 : baseIntensity);
    };
    // Fonts load late and themes swap colors: redraw on both.
    refresh();
    document.fonts?.ready.then(refresh);
    const themes = new MutationObserver(refresh);
    themes.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-palette"] });
    const resize = new ResizeObserver(refresh);
    resize.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !reduced;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(host);
    const enter = () => (hover = true);
    const leave = () => (hover = false);
    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      themes.disconnect();
      resize.disconnect();
      io.disconnect();
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointerleave", leave);
    };
  }, [text, baseIntensity, hoverIntensity, color, slice, reduced]);

  return (
    <Tag ref={ref} className={cn("inline-block", className)}>
      <span className="sr-only">{text}</span>
      <canvas ref={canvasRef} aria-hidden="true" className="block max-w-full" />
    </Tag>
  );
}
