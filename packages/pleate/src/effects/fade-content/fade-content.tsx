// FadeContent: its content fades in, optionally out of a blur, when it scrolls into view. Renders still with
// reduced motion.
"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type FadeContentProps = {
  children: ReactNode;
  /** Start blurred and sharpen while fading in. */
  blur?: boolean;
  /** Seconds. */
  duration?: number;
  delay?: number;
  /** Starting opacity. */
  initialOpacity?: number;
  /** How much must be visible first (0 to 1). */
  threshold?: number;
  /** Animate once (default) or every time it enters. */
  once?: boolean;
  className?: string;
};

export function FadeContent({ children, blur = false, duration = 1, delay = 0, initialOpacity = 0, threshold = 0.15, once = true, className }: FadeContentProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: initialOpacity, filter: blur ? "blur(12px)" : "blur(0px)" }}
      whileInView={{ opacity: 1, filter: "blur(0px)" }}
      viewport={{ once, amount: threshold }}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
