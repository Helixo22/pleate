// SplitText: the text is cut into letters or words that rise into place one after another when it scrolls into view.
// The starting offset, opacity and rotation are props, so the same component covers drops, slides and tilts.
"use client";

import { motion, useInView } from "motion/react";
import { useRef, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { Accessible, isSpace, splitText, type SplitBy } from "../animated-text/split.tsx";

export type SplitTextProps = {
  text: string;
  by?: SplitBy;
  as?: ElementType;
  /** Where each piece starts: offset in px, opacity, rotation in degrees. */
  from?: { x?: number; y?: number; opacity?: number; rotate?: number };
  /** Seconds between pieces. */
  stagger?: number;
  /** Seconds per piece. */
  duration?: number;
  delay?: number;
  once?: boolean;
  /** Called after the last piece lands. */
  onComplete?: () => void;
  className?: string;
};

export function SplitText({
  text,
  by = "letter",
  as: Tag = "p",
  from = { y: 40, opacity: 0 },
  stagger,
  duration = 0.6,
  delay = 0,
  once = true,
  onComplete,
  className,
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();
  const step = stagger ?? (by === "word" ? 0.08 : 0.03);
  const pieces = splitText(text, by);
  const last = pieces.length - 1;
  return (
    <Tag ref={ref} className={cn(className)}>
      <Accessible text={text}>
        {pieces.map((piece, i) =>
          isSpace(piece) ? (
            piece
          ) : (
            <motion.span
              key={i}
              className="inline-block whitespace-pre will-change-transform"
              initial={reduced ? false : { x: 0, y: 0, rotate: 0, opacity: 1, ...from }}
              animate={inView || reduced ? { x: 0, y: 0, rotate: 0, opacity: 1 } : undefined}
              transition={{ duration, delay: delay + i * step, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={i === last ? onComplete : undefined}
            >
              {piece}
            </motion.span>
          ),
        )}
      </Accessible>
    </Tag>
  );
}
