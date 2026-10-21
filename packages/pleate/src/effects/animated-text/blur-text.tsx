// BlurText: words (or letters) rise out of a blur one after another when the text scrolls into view.
"use client";

import { motion, useInView } from "motion/react";
import { useRef, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { Accessible, isSpace, splitText, type SplitBy } from "./split.tsx";

export type BlurTextProps = {
  text: string;
  by?: SplitBy;
  as?: ElementType;
  /** Seconds between pieces. */
  stagger?: number;
  delay?: number;
  /** Pixels each piece travels up. */
  distance?: number;
  once?: boolean;
  className?: string;
};

export function BlurText({ text, by = "word", as: Tag = "p", stagger, delay = 0, distance = 14, once = true, className }: BlurTextProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();
  const step = stagger ?? (by === "word" ? 0.08 : 0.025);
  const pieces = splitText(text, by);
  return (
    <Tag ref={ref} className={cn(className)}>
      <Accessible text={text}>
        {pieces.map((piece, i) =>
          isSpace(piece) ? (
            piece
          ) : (
            <motion.span
              key={i}
              className="inline-block whitespace-pre will-change-[filter,transform,opacity]"
              initial={reduced ? false : { opacity: 0, y: distance, filter: "blur(10px)" }}
              animate={inView || reduced ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
              transition={{ duration: 0.6, delay: delay + i * step, ease: [0.22, 1, 0.36, 1] }}
            >
              {piece}
            </motion.span>
          ),
        )}
      </Accessible>
    </Tag>
  );
}
