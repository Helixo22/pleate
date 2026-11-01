// ScrollStack: cards that pile up as you scroll. Each card sticks near the top a little lower than the one before
// and shrinks back as the next ones slide over it. The stack scrolls inside its own region (give it a height);
// reduced motion keeps the sticking but drops the scaling.
"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Children, useRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type ScrollStackProps = {
  children: ReactNode;
  /** Top offset of the first stuck card (px). */
  top?: number;
  /** Extra offset per card (px). */
  offset?: number;
  /** How much each covered card shrinks. */
  shrink?: number;
  "aria-label"?: string;
  className?: string;
};

function Item({ i, n, progress, top, offset, shrink, children }: { i: number; n: number; progress: MotionValue<number>; top: number; offset: number; shrink: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const scale = useTransform(progress, [i / n, 1], [1, 1 - (n - 1 - i) * shrink]);
  return (
    <motion.div className="sticky origin-top" style={{ top: top + i * offset, scale: reduced ? 1 : scale }}>
      {children}
    </motion.div>
  );
}

export function ScrollStack({ children, top = 24, offset = 14, shrink = 0.04, className, ...aria }: ScrollStackProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: ref });
  const items = Children.toArray(children);
  return (
    <div ref={ref} tabIndex={0} role="region" aria-label={aria["aria-label"] ?? "Card stack"} className={cn("pl-focus-ring h-[34rem] overflow-y-auto overscroll-contain rounded-3xl", className)}>
      <div className="flex flex-col gap-10 px-4 pt-6" style={{ paddingBottom: "45%" }}>
        {items.map((child, i) => (
          <Item key={i} i={i} n={items.length} progress={scrollYProgress} top={top} offset={offset} shrink={shrink}>
            {child}
          </Item>
        ))}
      </div>
    </div>
  );
}

export type ScrollStackCardProps = HTMLAttributes<HTMLDivElement>;

/** A ready-made card for the stack (any element works). */
export function ScrollStackCard({ className, ...props }: ScrollStackCardProps) {
  return <div className={cn("min-h-64 rounded-3xl bg-surface p-7 shadow-[var(--pl-shadow-lg)] pl-field [--pl-field-border:var(--pl-separator)]", className)} {...props} />;
}
