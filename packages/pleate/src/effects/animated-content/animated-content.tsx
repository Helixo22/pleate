// AnimatedContent: slides its content in from any side (with optional fade and scale) when it scrolls into view,
// on a spring or a tween. Renders still with reduced motion.
"use client";

import { motion, type Transition } from "motion/react";
import type { ReactNode } from "react";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type AnimatedContentProps = {
  children: ReactNode;
  /** Axis of travel. */
  direction?: "vertical" | "horizontal";
  /** Pixels traveled. */
  distance?: number;
  /** Come from above / the left instead of below / the right. */
  reverse?: boolean;
  /** Starting opacity (1 turns the fade off). */
  initialOpacity?: number;
  /** Starting scale. */
  scale?: number;
  /** "spring" for a physical settle, or a duration in seconds for a smooth tween. */
  motion?: "spring" | number;
  delay?: number;
  /** How much must be visible first (0 to 1). */
  threshold?: number;
  /** Animate once (default) or every time it enters. */
  once?: boolean;
  className?: string;
};

export function AnimatedContent({ children, direction = "vertical", distance = 80, reverse = false, initialOpacity = 0, scale = 1, motion: kind = "spring", delay = 0, threshold = 0.15, once = true, className }: AnimatedContentProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  const offset = reverse ? -distance : distance;
  const transition: Transition = kind === "spring" ? { type: "spring", stiffness: 120, damping: 18, delay } : { duration: kind, delay, ease: [0.22, 1, 0.36, 1] };
  return (
    <motion.div
      className={className}
      initial={{ opacity: initialOpacity, scale, x: direction === "horizontal" ? offset : 0, y: direction === "vertical" ? offset : 0 }}
      whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      viewport={{ once, amount: threshold }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
