// WarpText: letters ride a travelling sine wave, lifting and leaning as it passes. Near the pointer the wave grows,
// so the word bends around the cursor. Screen readers get the plain text; reduced motion keeps the letters still.
"use client";

import { useEffect, useRef, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { Accessible, isSpace, splitText } from "../animated-text/split.tsx";

export type WarpTextProps = {
  text: string;
  as?: ElementType;
  /** Wave height at rest, in em. */
  amplitude?: number;
  /** Extra height right under the pointer, in em. */
  pointerAmplitude?: number;
  /** Letters per wave. */
  wavelength?: number;
  /** Waves per second. */
  speed?: number;
  /** Maximum lean (deg). */
  skew?: number;
  className?: string;
};

export function WarpText({ text, as: Tag = "span", amplitude = 0.08, pointerAmplitude = 0.25, wavelength = 10, speed = 0.6, skew = 10, className }: WarpTextProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const host = ref.current;
    if (!host || reduced) return;
    const letters = [...host.querySelectorAll<HTMLElement>("[data-letter]")];
    const centers = letters.map(() => 0);
    let px = -1e4;
    let boost = 0;
    let raf = 0;
    let visible = false;
    const start = performance.now();
    const loop = (now: number) => {
      const t = (now - start) / 1000;
      boost += ((px > -1e3 ? 1 : 0) - boost) * 0.08;
      letters.forEach((el, i) => {
        if (i % 8 === 0 || !centers[i]) {
          const b = el.getBoundingClientRect();
          centers[i] = b.left + b.width / 2;
        }
        const near = boost * Math.exp(-(((centers[i] - px) / 120) ** 2));
        const phase = (i / wavelength) * Math.PI * 2 - t * speed * Math.PI * 2;
        const a = amplitude + pointerAmplitude * near;
        el.style.transform = `translateY(${(Math.sin(phase) * a).toFixed(3)}em) skewX(${(Math.cos(phase) * skew * (a / (amplitude + pointerAmplitude))).toFixed(2)}deg)`;
      });
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(host);
    const move = (e: PointerEvent) => (px = e.clientX);
    const leave = () => (px = -1e4);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      for (const el of letters) el.style.transform = "";
    };
  }, [text, amplitude, pointerAmplitude, wavelength, speed, skew, reduced]);

  return (
    <Tag ref={ref} className={cn("inline-block", className)}>
      <Accessible text={text}>
        {splitText(text, "word").map((word, i) =>
          isSpace(word) ? (
            word
          ) : (
            <span key={i} className="inline-block whitespace-nowrap">
              {[...word].map((ch, j) => (
                <span key={j} data-letter="" className="inline-block will-change-transform">
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
