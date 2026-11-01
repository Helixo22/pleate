// ScrollVelocity: marquee rows that drift on their own and rush ahead when you scroll; scrolling up turns them
// around. Rows alternate direction. Reduced motion shows the rows still; screen readers get each text once.
"use client";

import { motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import { useRef } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type ScrollVelocityProps = {
  /** One row per string. */
  texts: string[];
  /** Resting speed in % of one copy per second; odd rows run the other way. */
  velocity?: number;
  /** How strongly scroll speed adds to the drift. */
  boost?: number;
  /** Copies per row (raise it for short text on wide screens). */
  copies?: number;
  className?: string;
  rowClassName?: string;
};

function Row({ text, velocity, boost, copies, className }: { text: string; velocity: number; boost: number; copies: number; className?: string }) {
  const reduced = useReducedMotion();
  const base = useMotionValue(0);
  const { scrollY } = useScroll();
  const smooth = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1000], [0, boost], { clamp: false });
  const dir = useRef(1);
  const span = 100 / copies;
  const x = useTransform(base, (v) => `${(((v % span) + span) % span) - span}%`);
  useAnimationFrame((_, delta) => {
    if (reduced) return;
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    const step = ((dir.current * velocity * span) / 100) * (delta / 1000);
    base.set(base.get() + step + step * Math.abs(f));
  });
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <span className="sr-only">{text}</span>
      <motion.div aria-hidden="true" className="flex w-max" style={{ x }}>
        {Array.from({ length: copies }, (_, i) => (
          <span key={i} className={cn("pr-[0.5em]", className)}>
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function ScrollVelocity({ texts, velocity = 40, boost = 4, copies = 6, className, rowClassName }: ScrollVelocityProps) {
  return (
    <div className={cn("grid w-full", className)}>
      {texts.map((text, i) => (
        <Row key={i} text={text} velocity={i % 2 ? -velocity : velocity} boost={boost} copies={copies} className={rowClassName} />
      ))}
    </div>
  );
}
