// ScrollFloat: letters float up from below and un-squash as the text scrolls into view, tied to the scroll position
// (scroll back and they sink again). Reduced motion shows the plain text.
"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { Accessible, isSpace, splitText } from "../animated-text/split.tsx";

export type ScrollFloatProps = {
  text: string;
  as?: ElementType;
  /** Share of the scroll range over which letters start one after another (0 to 1). */
  stagger?: number;
  className?: string;
};

function Letter({ ch, progress, start, end }: { ch: string; progress: MotionValue<number>; start: number; end: number }) {
  const range = [start, end];
  const y = useTransform(progress, range, ["120%", "0%"]);
  const scaleY = useTransform(progress, range, [2.3, 1]);
  const scaleX = useTransform(progress, range, [0.7, 1]);
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <motion.span className="inline-block origin-bottom will-change-transform" style={{ y, scaleY, scaleX, opacity }}>
      {ch}
    </motion.span>
  );
}

export function ScrollFloat({ text, as: Tag = "h2", stagger = 0.5, className }: ScrollFloatProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center 55%"] });
  const total = text.replace(/\s/g, "").length || 1;
  let n = 0;
  return (
    <Tag ref={ref} className={cn(className)}>
      {reduced ? (
        text
      ) : (
        <Accessible text={text}>
          {splitText(text, "word").map((word, w) =>
            isSpace(word) ? (
              word
            ) : (
              <span key={w} className="inline-block whitespace-nowrap">
                {[...word].map((ch, i) => {
                  const start = (n++ / total) * stagger;
                  return <Letter key={i} ch={ch} progress={scrollYProgress} start={start} end={start + 1 - stagger} />;
                })}
              </span>
            ),
          )}
        </Accessible>
      )}
    </Tag>
  );
}
