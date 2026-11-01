// TextLoop: phrases roll upward through a drum, one step at a time, forever. With `rows` above 1 the neighbors
// stay visible and fade toward the edges. Screen readers get every phrase once; reduced motion stops the drum.
"use client";

import { motion } from "motion/react";
import { useEffect, useState, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type TextLoopProps = {
  items: string[];
  as?: ElementType;
  /** Seconds each phrase stays in the middle. */
  interval?: number;
  /** Seconds per step. */
  duration?: number;
  /** Visible rows: 1 shows a single slot, 3 or 5 show faded neighbors. */
  rows?: 1 | 3 | 5;
  className?: string;
};

const ROW = 1.25; // em per row

export function TextLoop({ items, as: Tag = "span", interval = 2, duration = 0.6, rows = 1, className }: TextLoopProps) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [jump, setJump] = useState(false);
  const pad = (rows - 1) / 2;

  useEffect(() => {
    if (reduced || items.length < 2) return;
    const id = setInterval(() => {
      setJump(false);
      setIndex((i) => i + 1);
    }, interval * 1000);
    return () => clearInterval(id);
  }, [reduced, interval, items.length]);

  // The list is drawn with copies before and after so the drum never shows a gap; after passing the last phrase
  // it snaps back to the same phrase at the start without animating.
  const strip = [...items.slice(-pad || items.length), ...items, ...items.slice(0, pad + 1)].slice(pad ? 0 : items.length);
  const mask = rows > 1 ? "linear-gradient(transparent, #000 35%, #000 65%, transparent)" : undefined;

  return (
    <Tag className={cn("relative inline-block overflow-hidden align-bottom", className)} style={{ height: `${rows * ROW}em`, maskImage: mask, WebkitMaskImage: mask }}>
      <span className="sr-only">{items.join(", ")}</span>
      <motion.span
        aria-hidden="true"
        className="flex flex-col"
        initial={false}
        animate={{ y: `${-index * ROW}em` }}
        transition={jump ? { duration: 0 } : { duration, ease: [0.65, 0, 0.35, 1] }}
        onAnimationComplete={() => {
          if (index >= items.length) {
            setJump(true);
            setIndex(0);
          }
        }}
      >
        {strip.map((item, i) => (
          <span key={i} className="block whitespace-nowrap" style={{ height: `${ROW}em`, lineHeight: `${ROW}em` }}>
            {item}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
