// CountUp: a number that counts to its value when it scrolls into view, formatted with Intl (currency, percent,
// compact…). Readers and reduced motion get the final value directly.
"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type CountUpProps = {
  to: number;
  from?: number;
  /** Seconds. */
  duration?: number;
  format?: Intl.NumberFormatOptions;
  locale?: string;
  className?: string;
};

export function CountUp({ to, from = 0, duration = 1.6, format, locale, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(from);
  const fmt = useMemo(() => new Intl.NumberFormat(locale, format), [locale, format]);
  useEffect(() => {
    if (reduced) return setValue(to);
    if (!inView) return;
    const controls = animate(from, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setValue });
    return () => controls.stop();
  }, [inView, reduced, from, to, duration]);
  return (
    <span ref={ref} className={cn("pl-tabular", className)}>
      <span aria-hidden="true">{fmt.format(value)}</span>
      <span className="sr-only">{fmt.format(to)}</span>
    </span>
  );
}
