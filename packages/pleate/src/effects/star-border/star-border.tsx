// StarBorder: a thin border with a point of light running around it, like a comet circling a button or card.
// Renders a <button> by default; pass `as` for a link or any element. Reduced motion keeps the light still.
"use client";

import { motion } from "motion/react";
import type { ComponentPropsWithoutRef, CSSProperties, ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type StarBorderProps<T extends ElementType = "button"> = {
  as?: T;
  /** Light color (CSS). */
  color?: string;
  /** Seconds per lap. */
  speed?: number;
  /** Border width (px). */
  thickness?: number;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "color">;

export function StarBorder<T extends ElementType = "button">({ as, color = "var(--pl-accent)", speed = 4, thickness = 1.5, className, children, style, ...props }: StarBorderProps<T>) {
  const Tag: ElementType = as ?? "button";
  const reduced = useReducedMotion();
  return (
    <Tag
      className={cn("pl-focus-ring relative isolate inline-grid cursor-pointer overflow-hidden rounded-full bg-separator text-body text-fg", className)}
      style={{ padding: thickness, ...(style as CSSProperties) }}
      {...props}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[1] grid place-items-center">
        <motion.span
          className="aspect-square w-[max(100%,12rem)] shrink-0 scale-[1.5]"
          style={{ background: `conic-gradient(from 0deg, transparent 0 65%, ${color} 85%, transparent 100%)` }}
          animate={reduced ? undefined : { rotate: 360 }}
          transition={{ duration: speed, ease: "linear", repeat: Infinity }}
        />
      </span>
      <span className="relative rounded-[inherit] bg-surface px-6 py-3">{children}</span>
    </Tag>
  );
}
