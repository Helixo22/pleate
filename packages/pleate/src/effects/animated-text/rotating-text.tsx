// RotatingText: one word at a time from a list, rolling up into place ("Plan trips to Lisbon / Kyoto / Naples").
// The box resizes smoothly to each word. Screen readers hear the first word only (no repeated announcements).
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "../../lib/cn.ts";
import { spring } from "../../motion/tokens.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type RotatingTextProps = {
  words: string[];
  /** Milliseconds per word. */
  interval?: number;
  className?: string;
  /** Classes of the pill around the word (e.g. a tinted background). */
  pillClassName?: string;
};

export function RotatingText({ words, interval = 2200, className, pillClassName }: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || words.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [interval, reduced, words.length]);
  return (
    <span className={cn("inline-flex", className)}>
      <span className="sr-only">{words[0]}</span>
      <motion.span
        aria-hidden="true"
        layout={!reduced}
        transition={spring.soft}
        className={cn("relative inline-flex overflow-hidden whitespace-nowrap", pillClassName)}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={words[index]}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={spring.soft}
            className="inline-block"
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </span>
  );
}
