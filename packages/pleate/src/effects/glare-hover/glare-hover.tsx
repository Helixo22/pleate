// GlareHover: a band of light sweeps across the surface when the pointer enters, like light catching glass. CSS
// only; hover devices only (Tailwind's hover variant), nothing under reduced motion.
"use client";

import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type GlareHoverProps = HTMLAttributes<HTMLDivElement> & {
  /** Glare color (CSS). */
  color?: string;
  /** 0 to 1: glare strength. */
  opacity?: number;
  /** Direction of the band in degrees. */
  angle?: number;
  /** Width of the band, as a share of the surface (0 to 1). */
  width?: number;
  /** Sweep duration in ms. */
  duration?: number;
};

export function GlareHover({ color = "white", opacity = 0.35, angle = -45, width = 0.25, duration = 700, className, children, ...props }: GlareHoverProps) {
  const reduced = useReducedMotion();
  const tint = `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
  const half = (width * 100) / 2;
  const band: CSSProperties = {
    backgroundImage: `linear-gradient(${angle}deg, transparent ${50 - half}%, ${tint} 50%, transparent ${50 + half}%)`,
    backgroundSize: "300% 300%",
    transitionDuration: `${duration}ms`,
  };
  return (
    <div className={cn("group/glare relative isolate overflow-hidden", className)} {...props}>
      {children}
      {!reduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-no-repeat [background-position:100%_100%] transition-[background-position] ease-out group-hover/glare:[background-position:0%_0%]"
          style={band}
        />
      )}
    </div>
  );
}
