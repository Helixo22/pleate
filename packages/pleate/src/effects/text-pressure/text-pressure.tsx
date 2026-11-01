// TextPressure: a heading that fills its container's width, where each letter gets heavier and taller as the
// pointer comes near, like pressing into the type. It needs a variable font with a weight axis (Geist, Inter...).
// Screen readers get the plain text; reduced motion and touch screens keep the letters at rest.
"use client";

import { useEffect, useRef, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type TextPressureProps = {
  text: string;
  as?: ElementType;
  /** Weight far from the pointer and right under it. */
  minWeight?: number;
  maxWeight?: number;
  /** Stretch letters vertically near the pointer. */
  stretch?: boolean;
  /** Fade letters far from the pointer. */
  alpha?: boolean;
  className?: string;
};

export function TextPressure({ text, as: Tag = "div", minWeight = 200, maxWeight = 900, stretch = true, alpha = false, className }: TextPressureProps) {
  const ref = useRef<HTMLElement>(null);
  const row = useRef<HTMLSpanElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const reduced = useReducedMotion();
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const live = fine && !reduced;
  const rest = live ? minWeight : (minWeight + maxWeight) / 2;

  // Fit: measure the row at a known size, then scale the font so it spans the container.
  useEffect(() => {
    const host = ref.current;
    const r = row.current;
    if (!host || !r) return;
    const fit = () => {
      // Measured with every letter at full weight, so pressed letters never overflow.
      const saved = letters.current.map((el) => el?.style.fontVariationSettings ?? "");
      letters.current.forEach((el) => el && (el.style.fontVariationSettings = `"wght" ${maxWeight}`));
      r.style.fontSize = "100px";
      r.style.width = "max-content";
      const natural = r.scrollWidth || 1;
      r.style.width = "";
      letters.current.forEach((el, i) => el && (el.style.fontVariationSettings = saved[i]));
      r.style.fontSize = `${(100 * host.clientWidth) / natural}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    const resize = new ResizeObserver(fit);
    resize.observe(host);
    return () => resize.disconnect();
  }, [text, maxWeight]);

  useEffect(() => {
    const host = ref.current;
    if (!host || !live) return;
    const target = { x: -1e4, y: -1e4 };
    const eased = { x: -1e4, y: -1e4 };
    let raf = 0;
    const frame = () => {
      eased.x += (target.x - eased.x) * 0.15;
      eased.y += (target.y - eased.y) * 0.15;
      const reach = host.clientWidth / 3;
      for (const el of letters.current) {
        if (!el) continue;
        const b = el.getBoundingClientRect();
        const d = Math.hypot(eased.x - (b.left + b.width / 2), eased.y - (b.top + b.height / 2));
        const k = Math.max(0, 1 - d / reach);
        el.style.fontVariationSettings = `"wght" ${Math.round(minWeight + (maxWeight - minWeight) * k)}`;
        if (stretch) el.style.transform = `scaleY(${1 + k * 0.25})`;
        if (alpha) el.style.opacity = String(0.25 + k * 0.75);
      }
      raf = Math.abs(target.x - eased.x) + Math.abs(target.y - eased.y) > 0.5 ? requestAnimationFrame(frame) : 0;
    };
    const move = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (eased.x < -1e3) Object.assign(eased, target);
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const leave = () => {
      target.x = target.y = -1e4;
      Object.assign(eased, target);
      if (!raf) raf = requestAnimationFrame(frame);
    };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, [live, minWeight, maxWeight, stretch, alpha]);

  return (
    <Tag ref={ref} className={cn("block w-full overflow-hidden leading-none", className)}>
      <span className="sr-only">{text}</span>
      <span ref={row} aria-hidden="true" className="flex w-full justify-between whitespace-pre select-none">
        {[...text].map((ch, i) => (
          <span
            key={i}
            ref={(el) => {
              letters.current[i] = el;
            }}
            className="inline-block origin-bottom"
            style={{ fontVariationSettings: `"wght" ${rest}`, opacity: alpha && live ? 0.25 : undefined }}
          >
            {ch}
          </span>
        ))}
      </span>
    </Tag>
  );
}
