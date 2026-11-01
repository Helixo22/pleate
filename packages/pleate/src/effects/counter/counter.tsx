// Counter: a number whose digits roll like a mechanical counter when the value changes. Each place spins on its
// own spring and passes through the digits in between (going 9 to 0 carries into the next place), with soft fades
// above and below the window. Screen readers get the plain number. Reduced motion jumps to the new value. For a
// slot-machine style roll from zero on view, see Odometer in pleate/effects/motion-graphics.
"use client";

import { motion, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type CounterProps = {
  /** Whole number to show (negatives show a minus sign). */
  value: number;
  /** Minimum number of digits (pads with leading zeros). */
  minDigits?: number;
  /** Font size in px; the digit window follows it. */
  fontSize?: number;
  /** Fade above and below the digits, as a share of the digit height (0 turns it off). */
  fade?: number;
  /** Spring stiffness; higher rolls faster. */
  stiffness?: number;
  className?: string;
};

export function Counter({ value, minDigits = 1, fontSize = 64, fade = 0.18, stiffness = 120, className }: CounterProps) {
  const whole = Math.round(Math.abs(value));
  const digits = Math.max(minDigits, String(whole).length);
  const places = Array.from({ length: digits }, (_, i) => 10 ** (digits - 1 - i));
  const height = Math.round(fontSize * 1.3);
  const mask = fade > 0 ? `linear-gradient(transparent, #000 ${fade * 100}%, #000 ${100 - fade * 100}%, transparent)` : undefined;

  return (
    <span className={cn("relative inline-flex pl-tabular font-semibold tracking-tight text-fg", className)} style={{ fontSize, lineHeight: `${height}px` }}>
      <span className="sr-only">{value < 0 ? `-${whole}` : whole}</span>
      <span aria-hidden="true" className="inline-flex overflow-hidden" style={{ height, maskImage: mask, WebkitMaskImage: mask }}>
        {value < 0 && <span>-</span>}
        {places.map((place) => (
          <Place key={place} place={place} value={whole} height={height} stiffness={stiffness} />
        ))}
      </span>
    </span>
  );
}

function Place({ place, value, height, stiffness }: { place: number; value: number; height: number; stiffness: number }) {
  const reduced = useReducedMotion();
  // The count of whole `place` units, e.g. 1234 at the tens place is 123; its last digit is what shows.
  const target = Math.floor(value / place);
  const spring = useSpring(target, { stiffness, damping: 20, mass: 0.8 });
  useEffect(() => {
    if (reduced) spring.jump(target);
    else spring.set(target);
  }, [target, reduced, spring]);
  return (
    <span className="relative inline-block w-[1ch]" style={{ height }}>
      {Array.from({ length: 10 }, (_, d) => (
        <Digit key={d} digit={d} spring={spring} height={height} />
      ))}
    </span>
  );
}

function Digit({ digit, spring, height }: { digit: number; spring: MotionValue<number>; height: number }) {
  // Distance from the showing position, wrapped to -5..5 so every digit sits just above or below the window.
  const y = useTransform(spring, (v) => {
    let offset = (digit - (v % 10) + 10) % 10;
    if (offset > 5) offset -= 10;
    return offset * height;
  });
  return (
    <motion.span className="absolute inset-0 grid place-items-center" style={{ y }}>
      {digit}
    </motion.span>
  );
}
