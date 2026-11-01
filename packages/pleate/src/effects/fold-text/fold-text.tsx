// FoldText: every letter is a piece of paper folded along its middle. On view the halves open flat one after
// another; on hover the bottom halves fold back toward you and spring flat again. Screen readers get the plain
// text; reduced motion shows it flat.
"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { Accessible, isSpace, splitText } from "../animated-text/split.tsx";

export type FoldTextProps = {
  text: string;
  as?: ElementType;
  /** "view" unfolds once when scrolled into view; "hover" folds while hovered. */
  trigger?: "view" | "hover";
  /** Seconds between letters. */
  stagger?: number;
  /** Fold angle on hover (deg). */
  angle?: number;
  className?: string;
};

export function FoldText({ text, as: Tag = "span", trigger = "view", stagger = 0.04, angle = 70, className }: FoldTextProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();
  const [hover, setHover] = useState(false);
  const closed = trigger === "view" && !inView;
  const top = reduced ? 0 : closed ? 90 : 0;
  const bottom = reduced ? 0 : closed ? -90 : hover ? angle : 0;
  let n = 0;

  return (
    <Tag
      ref={ref}
      onPointerEnter={trigger === "hover" ? () => setHover(true) : undefined}
      onPointerLeave={trigger === "hover" ? () => setHover(false) : undefined}
      className={cn("inline-block", className)}
    >
      <Accessible text={text}>
        {splitText(text, "word").map((word, i) =>
          isSpace(word) ? (
            word
          ) : (
            <span key={i} className="inline-block whitespace-nowrap">
              {[...word].map((ch, j) => {
                const transition = { duration: 0.6, delay: n++ * stagger, ease: [0.22, 1, 0.36, 1] as const };
                return (
                  <span key={j} className="relative inline-block [perspective:400px]">
                    <span className="invisible">{ch}</span>
                    <motion.span
                      className="absolute inset-0 [clip-path:inset(0_0_50%_0)]"
                      initial={false}
                      animate={{ rotateX: top, opacity: top ? 0 : 1 }}
                      transition={transition}
                    >
                      {ch}
                    </motion.span>
                    <motion.span
                      className="absolute inset-0 [clip-path:inset(50%_0_0_0)]"
                      initial={false}
                      animate={{ rotateX: bottom, opacity: bottom === -90 ? 0 : 1, filter: `brightness(${1 - Math.abs(bottom) / 200})` }}
                      transition={transition}
                    >
                      {ch}
                    </motion.span>
                  </span>
                );
              })}
            </span>
          ),
        )}
      </Accessible>
    </Tag>
  );
}
