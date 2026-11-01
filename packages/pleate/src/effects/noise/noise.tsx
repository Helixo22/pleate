// Noise: animated film grain laid over its parent (give the parent `relative`). It draws a small random tile on a
// canvas, refreshes it every few frames, and lets the browser tile and scale it, so it stays cheap at any size.
// Decorative and click-through. Reduced motion keeps one still grain.
"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type NoiseProps = {
  /** Grain strength, 0 to 1. */
  opacity?: number;
  /** Grain size (CSS px per grain). */
  grainSize?: number;
  /** Frames between two grain patterns; higher is calmer. */
  refreshInterval?: number;
  /** Blend mode over the content. */
  blend?: CSSProperties["mixBlendMode"];
  className?: string;
};

const TILE = 128;

export function Noise({ opacity = 0.12, grainSize = 1.5, refreshInterval = 2, blend = "normal", className }: NoiseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = TILE;
    const ctx = canvas.getContext("2d");
    if (!el || !ctx) return;
    const image = ctx.createImageData(TILE, TILE);
    const paint = () => {
      const d = image.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() < 0.5 ? 0 : 255;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = Math.random() * 255;
      }
      ctx.putImageData(image, 0, 0);
      el.style.backgroundImage = `url(${canvas.toDataURL()})`;
    };
    // One tile, shifted to a random offset on refresh: the grain changes without making a new image per frame.
    paint();
    if (reduced) return;
    let frame = 0, n = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (++n % Math.max(1, refreshInterval)) return;
      el.style.backgroundPosition = `${Math.floor(Math.random() * TILE)}px ${Math.floor(Math.random() * TILE)}px`;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, refreshInterval]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{ opacity, mixBlendMode: blend, backgroundSize: `${TILE * grainSize}px`, imageRendering: "pixelated" }}
    />
  );
}
