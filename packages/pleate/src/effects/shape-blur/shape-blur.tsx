// ShapeBlur: a crisp shape or logo that drifts out of focus under the pointer, like a lens with a shallow depth of
// field. Two copies of the children trade places through a soft circle that follows the cursor: the crisp one
// fades out inside it, a blurred one fades in. Mouse and pen only; touch screens and reduced motion get the crisp
// children.
"use client";

import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type ShapeBlurProps = HTMLAttributes<HTMLDivElement> & {
  /** Blur at the center of the lens (px). */
  blur?: number;
  /** Lens radius (px). */
  radius?: number;
};

const lens = (radius: number, inside: string, outside: string): CSSProperties => {
  const mask = `radial-gradient(circle ${radius}px at var(--pl-lens-x, -999px) var(--pl-lens-y, -999px), ${inside} 30%, ${outside})`;
  return { maskImage: mask, WebkitMaskImage: mask };
};

export function ShapeBlur({ blur = 10, radius = 110, className, children, onPointerMove, onPointerLeave, ...props }: ShapeBlurProps) {
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const on = fine && !reduced;
  return (
    <div
      className={cn("relative inline-block", className)}
      onPointerMove={(e) => {
        onPointerMove?.(e);
        if (e.pointerType === "touch") return;
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--pl-lens-x", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--pl-lens-y", `${e.clientY - r.top}px`);
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e);
        e.currentTarget.style.removeProperty("--pl-lens-x");
        e.currentTarget.style.removeProperty("--pl-lens-y");
      }}
      {...props}
    >
      <div style={on ? lens(radius, "transparent", "#000") : undefined}>{children}</div>
      {on && (
        <div aria-hidden="true" inert className="pointer-events-none absolute inset-0" style={lens(radius, "#000", "transparent")}>
          <div className="size-full" style={{ filter: `blur(${blur}px)` }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
