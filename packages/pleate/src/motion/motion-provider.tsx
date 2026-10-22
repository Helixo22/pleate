// <MotionProvider>: wraps Motion's MotionConfig so every motion component in the tree honours pleate's reduced-motion
// rule (system setting or data-motion="off"): transforms are skipped, opacity still fades.
"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { useReducedMotion } from "./use-reduced-motion.ts";

export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return <MotionConfig reducedMotion={reduced ? "always" : "never"}>{children}</MotionConfig>;
}
