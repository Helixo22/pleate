// DecryptedText: characters scramble and settle into the real text, left to right, on view, or on hover/focus.
"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type DecryptedTextProps = {
  text: string;
  as?: ElementType;
  trigger?: "view" | "hover";
  /** Milliseconds per revealed character. */
  speed?: number;
  characters?: string;
  className?: string;
  /** Classes for characters still scrambled. */
  scrambledClassName?: string;
};

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?";

export function DecryptedText({ text, as: Tag = "span", trigger = "view", speed = 35, characters = CHARS, className, scrambledClassName = "text-accent-ink" }: DecryptedTextProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [revealed, setRevealed] = useState(trigger === "view" ? 0 : text.length);
  const [tick, setTick] = useState(0);
  const running = revealed < text.length;

  const start = () => !reduced && setRevealed(0);
  useEffect(() => {
    if (trigger === "view" && inView && !reduced) setRevealed(0);
    if (reduced) setRevealed(text.length);
  }, [inView, trigger, reduced, text.length]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setRevealed((r) => Math.min(text.length, r + 1));
    }, speed);
    return () => clearInterval(id);
  }, [running, speed, text.length]);

  return (
    <Tag
      ref={ref}
      onPointerEnter={trigger === "hover" ? start : undefined}
      onFocus={trigger === "hover" ? start : undefined}
      className={cn("whitespace-pre-wrap", className)}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {[...text].map((ch, i) =>
          i < revealed || ch === " " ? (
            ch
          ) : (
            <span key={`${i}-${tick}`} className={scrambledClassName}>
              {characters[(i * 7 + tick * 13) % characters.length]}
            </span>
          ),
        )}
      </span>
    </Tag>
  );
}
