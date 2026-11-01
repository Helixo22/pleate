// ElectricBorder: a border that crackles like a live wire. An SVG turbulence filter displaces the border line and
// reseeds a few times a second; a soft glow sits behind it. Reduced motion keeps the border still.
// ElectricFilter is exported so other effects (ElectricLogo) can share it.
"use client";

import { useEffect, useId, useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type ElectricFilterProps = {
  id: string;
  /** Displacement in px: how wild the line gets. */
  chaos?: number;
  /** Crackle rate multiplier. */
  speed?: number;
};

/** An invisible <svg> holding the crackle filter; apply it with `filter: url(#id)`. */
export function ElectricFilter({ id, chaos = 6, speed = 1 }: ElectricFilterProps) {
  const noise = useRef<SVGFETurbulenceElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || speed <= 0) return;
    let seed = 1;
    const timer = setInterval(() => noise.current?.setAttribute("seed", String((seed = (seed % 97) + 1))), 1000 / (14 * speed));
    return () => clearInterval(timer);
  }, [reduced, speed]);
  return (
    <svg aria-hidden="true" className="absolute size-0">
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence ref={noise} type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="1" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={chaos} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

/** A filter id safe to use inside url(#...). */
export const useFilterId = (prefix: string) => prefix + useId().replace(/[^a-zA-Z0-9]/g, "");

export type ElectricBorderProps = HTMLAttributes<HTMLDivElement> & {
  /** Line and glow color (CSS). */
  color?: string;
  /** Line width in px. */
  thickness?: number;
  /** Displacement in px: how wild the line gets. */
  chaos?: number;
  /** Crackle rate multiplier (0 holds still). */
  speed?: number;
};

export function ElectricBorder({ color = "var(--pl-accent)", thickness = 2, chaos = 6, speed = 1, className, children, ...props }: ElectricBorderProps) {
  const id = useFilterId("pl-electric-");
  const line = { borderWidth: thickness, borderColor: color };
  return (
    <div className={cn("relative isolate rounded-xl", className)} {...props}>
      <ElectricFilter id={id} chaos={chaos} speed={speed} />
      {children}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit]">
        <div className="absolute inset-0 rounded-[inherit] border-solid opacity-60 blur-[6px]" style={line} />
        <div className="absolute inset-0 rounded-[inherit] border-solid" style={{ ...line, filter: `url(#${id})` }} />
        <div className="absolute inset-0 -z-[1] rounded-[inherit]" style={{ boxShadow: `0 0 32px -4px color-mix(in oklab, ${color} 45%, transparent)` }} />
      </div>
    </div>
  );
}
