// ElectricLogo: a logo (any SVG or text drawn in currentColor) charged with electricity: its shape crackles and a
// soft glow sits behind it. Shares the filter of ElectricBorder. Reduced motion keeps it still.
"use client";

import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { ElectricFilter, useFilterId } from "../electric-border/electric-border.tsx";

export type ElectricLogoProps = HTMLAttributes<HTMLDivElement> & {
  /** Logo color (CSS), applied as currentColor. */
  color?: string;
  /** Displacement in px: how wild the edges get. */
  chaos?: number;
  /** Crackle rate multiplier (0 holds still). */
  speed?: number;
  /** Glow blur in px (0 turns it off). */
  glow?: number;
};

export function ElectricLogo({ color = "var(--pl-accent)", chaos = 5, speed = 1, glow = 14, className, children, style, ...props }: ElectricLogoProps) {
  const id = useFilterId("pl-electric-logo-");
  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ color, ...style }} {...props}>
      <ElectricFilter id={id} chaos={chaos} speed={speed} />
      {glow > 0 && (
        <div aria-hidden="true" className="col-start-1 row-start-1" style={{ filter: `blur(${glow}px)`, opacity: 0.7 }}>
          {children}
        </div>
      )}
      <div className="col-start-1 row-start-1" style={{ filter: `url(#${id})` }}>
        {children}
      </div>
    </div>
  );
}
