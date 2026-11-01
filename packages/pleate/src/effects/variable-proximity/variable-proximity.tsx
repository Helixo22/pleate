// VariableProximity: letters near the pointer get heavier, fading back to the base weight with distance. Works in
// running text and wraps like normal text. Needs a variable font with a weight axis (Geist, Inter...).
// Screen readers get the plain text; reduced motion and touch screens show the base weight.
"use client";

import { useEffect, useRef, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { Accessible, isSpace, splitText } from "../animated-text/split.tsx";

export type VariableProximityProps = {
  text: string;
  as?: ElementType;
  /** Weight far from the pointer. */
  fromWeight?: number;
  /** Weight right under the pointer. */
  toWeight?: number;
  /** Reach of the effect (px). */
  radius?: number;
  /** How the weight drops with distance. */
  falloff?: "linear" | "exponential" | "gaussian";
  className?: string;
};

const CURVES = {
  linear: (d: number) => Math.max(0, 1 - d),
  exponential: (d: number) => (d >= 1 ? 0 : Math.exp(-4 * d)),
  gaussian: (d: number) => Math.exp(-((d * 2.2) ** 2)),
};

export function VariableProximity({ text, as: Tag = "span", fromWeight = 400, toWeight = 900, radius = 90, falloff = "linear", className }: VariableProximityProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const live = fine && !reduced;

  useEffect(() => {
    const host = ref.current;
    if (!host || !live) return;
    const letters = [...host.querySelectorAll<HTMLElement>("[data-letter]")];
    const curve = CURVES[falloff];
    let raf = 0;
    let px = -1e4;
    let py = -1e4;
    const frame = () => {
      raf = 0;
      for (const el of letters) {
        const b = el.getBoundingClientRect();
        const k = curve(Math.hypot(px - (b.left + b.width / 2), py - (b.top + b.height / 2)) / radius);
        el.style.fontVariationSettings = `"wght" ${Math.round(fromWeight + (toWeight - fromWeight) * k)}`;
      }
    };
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      const box = host.getBoundingClientRect();
      if (box.bottom < -radius || box.top > window.innerHeight + radius) return;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    // Listen on the window so letters react as the pointer approaches, not only once it is over them.
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      for (const el of letters) el.style.fontVariationSettings = `"wght" ${fromWeight}`;
    };
  }, [live, text, fromWeight, toWeight, radius, falloff]);

  return (
    <Tag ref={ref} className={cn(className)}>
      <Accessible text={text}>
        {splitText(text, "word").map((word, i) =>
          isSpace(word) ? (
            word
          ) : (
            <span key={i} className="inline-block whitespace-nowrap">
              {[...word].map((ch, j) => (
                <span key={j} data-letter="" className="inline-block" style={{ fontVariationSettings: `"wght" ${fromWeight}` }}>
                  {ch}
                </span>
              ))}
            </span>
          ),
        )}
      </Accessible>
    </Tag>
  );
}
