// CircularText: letters set around a circle that turns slowly, like a badge or a stamp. Hovering speeds it up, slows
// it down or pauses it. Reduced motion keeps it still; screen readers get the plain text once.
"use client";

import { motion, useAnimationFrame, useMotionValue } from "motion/react";
import { useRef } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type CircularTextProps = {
  /** The text around the circle. Add a separator at the end (like " • ") so the loop reads cleanly. */
  text: string;
  /** Seconds per full turn. */
  seconds?: number;
  /** What hovering does to the rotation. */
  onHover?: "speedUp" | "slowDown" | "pause" | "none";
  /** Diameter in px. */
  size?: number;
  className?: string;
};

const HOVER = { speedUp: 4, slowDown: 0.25, pause: 0, none: 1 };

export function CircularText({ text, seconds = 20, onHover = "speedUp", size = 180, className }: CircularTextProps) {
  const reduced = useReducedMotion();
  const rotate = useMotionValue(0);
  const factor = useRef(1);
  const target = useRef(1);
  useAnimationFrame((_, delta) => {
    if (reduced) return;
    factor.current += (target.current - factor.current) * Math.min(1, delta / 200);
    rotate.set((rotate.get() + ((360 / seconds) * factor.current * delta) / 1000) % 360);
  });
  const letters = [...text];
  return (
    <div
      className={cn("relative inline-block shrink-0 font-semibold uppercase", className)}
      style={{ width: size, height: size }}
      onPointerEnter={() => (target.current = HOVER[onHover])}
      onPointerLeave={() => (target.current = 1)}
    >
      <span className="sr-only">{text}</span>
      <motion.span aria-hidden="true" className="absolute inset-0" style={{ rotate }}>
        {letters.map((ch, i) => (
          <span key={i} className="absolute inset-0 flex justify-center" style={{ transform: `rotate(${(360 / letters.length) * i}deg)` }}>
            {ch}
          </span>
        ))}
      </motion.span>
    </div>
  );
}
