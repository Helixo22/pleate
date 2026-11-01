// Shuffle: each letter is a little slot that spins through random characters and lands on the real one, one after
// another, when the text comes into view and again on hover. Reduced motion shows the plain text.
"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { Accessible } from "../animated-text/split.tsx";

export type ShuffleProps = {
  text: string;
  as?: ElementType;
  /** Random characters each slot passes before landing. */
  shuffles?: number;
  /** Seconds per slot spin. */
  duration?: number;
  /** Seconds between slots. */
  stagger?: number;
  direction?: "up" | "down";
  /** Spin again on hover and focus. */
  replayOnHover?: boolean;
  characters?: string;
  className?: string;
};

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function Shuffle({
  text,
  as: Tag = "span",
  shuffles = 6,
  duration = 0.55,
  stagger = 0.04,
  direction = "up",
  replayOnHover = true,
  characters = CHARS,
  className,
}: ShuffleProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();
  const [run, setRun] = useState(0);
  const busy = useRef(false);
  const replay = () => {
    if (!replayOnHover || reduced || busy.current) return;
    busy.current = true;
    setRun((r) => r + 1);
  };
  const letters = [...text];
  const last = letters.findLastIndex((c) => c !== " ");

  return (
    <Tag ref={ref} onPointerEnter={replay} onFocus={replay} className={cn("inline-block whitespace-pre", className)}>
      <Accessible text={text}>
        {reduced
          ? text
          : letters.map((ch, i) => {
              if (ch === " ") return " ";
              // Deterministic "random" so server and client render the same column.
              const column = Array.from({ length: shuffles }, (_, k) => characters[(i * 31 + k * 17 + run * 7) % characters.length]);
              const cells = direction === "up" ? [...column, ch] : [ch, ...column];
              const end = `${(-shuffles / (shuffles + 1)) * 100}%`;
              return (
                <span key={i} className="relative inline-block overflow-hidden align-bottom">
                  <span className="invisible">{ch}</span>
                  <motion.span
                    key={run}
                    className="absolute inset-x-0 top-0 flex flex-col items-center"
                    initial={{ y: direction === "up" ? "0%" : end }}
                    animate={inView ? { y: direction === "up" ? end : "0%" } : undefined}
                    transition={{ duration, delay: i * stagger, ease: [0.65, 0, 0.35, 1] }}
                    onAnimationComplete={i === last ? () => (busy.current = false) : undefined}
                  >
                    {cells.map((c, k) => (
                      <span key={k}>{c}</span>
                    ))}
                  </motion.span>
                </span>
              );
            })}
      </Accessible>
    </Tag>
  );
}
