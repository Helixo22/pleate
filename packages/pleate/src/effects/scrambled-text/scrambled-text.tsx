// ScrambledText: letters near the pointer turn into random characters for a moment, then settle back.
// Fine pointer and motion allowed only; the real text is always what screen readers get.
"use client";

import { useEffect, useRef, useState, type ElementType, type PointerEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { Accessible } from "../animated-text/split.tsx";

export type ScrambledTextProps = {
  text: string;
  as?: ElementType;
  /** Pixels around the pointer that scramble. */
  radius?: number;
  /** Seconds a letter stays scrambled after the pointer passes. */
  duration?: number;
  characters?: string;
  className?: string;
  /** Classes for scrambled letters. */
  scrambledClassName?: string;
};

const CHARS = ".:/*+=#%&?<>";

export function ScrambledText({
  text,
  as: Tag = "p",
  radius = 90,
  duration = 0.8,
  characters = CHARS,
  className,
  scrambledClassName = "text-accent-ink",
}: ScrambledTextProps) {
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const letters = [...text];
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const until = useRef<number[]>([]);
  const frame = useRef(0);
  const [, setTick] = useState(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const loop = () => {
    setTick((t) => t + 1);
    const now = performance.now();
    frame.current = until.current.some((u) => u > now) ? requestAnimationFrame(loop) : 0;
  };

  const onMove = (event: PointerEvent) => {
    if (!fine || reduced) return;
    const end = performance.now() + duration * 1000;
    refs.current.forEach((el, i) => {
      if (!el || letters[i] === " ") return;
      const b = el.getBoundingClientRect();
      if (Math.hypot(event.clientX - (b.left + b.width / 2), event.clientY - (b.top + b.height / 2)) < radius) until.current[i] = end;
    });
    if (!frame.current) frame.current = requestAnimationFrame(loop);
  };

  const now = performance.now();
  return (
    <Tag onPointerMove={onMove} className={cn("whitespace-pre-wrap", className)}>
      <Accessible text={text}>
        {letters.map((ch, i) => {
          const on = (until.current[i] ?? 0) > now;
          return (
            <span
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className={on ? scrambledClassName : undefined}
            >
              {on ? characters[Math.floor(Math.random() * characters.length)] : ch}
            </span>
          );
        })}
      </Accessible>
    </Tag>
  );
}
