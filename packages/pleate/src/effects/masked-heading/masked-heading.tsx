// MaskedHeading: each line slides up from behind an invisible edge when the heading scrolls into view, one line
// after another. Pass the lines yourself so the breaks are yours. Reduced motion shows it at rest.
"use client";

import { motion, useInView } from "motion/react";
import { useRef, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type MaskedHeadingProps = {
  lines: string[];
  as?: ElementType;
  /** Seconds between lines. */
  stagger?: number;
  delay?: number;
  /** Seconds per line. */
  duration?: number;
  once?: boolean;
  className?: string;
};

export function MaskedHeading({ lines, as: Tag = "h2", stagger = 0.12, delay = 0, duration = 0.9, once = true, className }: MaskedHeadingProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();
  return (
    <Tag ref={ref} className={cn(className)}>
      <span className="sr-only">{lines.join(" ")}</span>
      {lines.map((line, i) => (
        // Padding plus negative margin keeps descenders inside the mask.
        <span key={i} aria-hidden="true" className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
          <motion.span
            className="block"
            initial={reduced ? false : { y: "110%" }}
            animate={inView || reduced ? { y: "0%" } : { y: "110%" }}
            transition={{ duration, delay: delay + i * stagger, ease: [0.22, 1, 0.36, 1] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
