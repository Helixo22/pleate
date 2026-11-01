// ScrollExpand: a rounded media frame that opens up to full bleed as it scrolls into the middle of the viewport,
// while the media inside settles from a slight zoom. The frame is a clip, so nothing reflows. Reduced motion shows
// it fully open.
"use client";

import { motion, useMotionTemplate, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type ScrollExpandProps = {
  children: ReactNode;
  /** Inset on each side at the start, in % of the width. */
  startInset?: number;
  /** Corner radius at the start (px); the end is square. */
  startRadius?: number;
  /** Zoom of the media at the start. */
  startZoom?: number;
  className?: string;
};

export function ScrollExpand({ children, startInset = 18, startRadius = 32, startZoom = 1.15, className }: ScrollExpandProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const inset = useTransform(scrollYProgress, [0, 1], [startInset, 0]);
  const radius = useTransform(scrollYProgress, [0, 1], [startRadius, 0]);
  const zoom = useTransform(scrollYProgress, [0, 1], [startZoom, 1]);
  const clipPath = useMotionTemplate`inset(${inset}% ${inset}% round ${radius}px)`;
  return (
    <motion.div ref={ref} className={cn("relative overflow-hidden", className)} style={reduced ? undefined : { clipPath }}>
      <motion.div className="size-full" style={reduced ? undefined : { scale: zoom }}>
        {children}
      </motion.div>
    </motion.div>
  );
}
