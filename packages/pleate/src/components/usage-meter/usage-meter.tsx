// UsageMeter: how much of a plan is used. One stacked bar of segments against a max, a legend with tabular figures and
// a total line ("7.2 of 10 GB"). The first segment carries the accent, the rest step down a neutral ramp; past warnAt
// or dangerAt the lead turns warning or danger. The bar grows from 0 the first time it is seen.
"use client";

import { useInView } from "motion/react";
import { useId, useMemo, useRef, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { Odometer } from "../../effects/motion-graphics/motion-graphics.tsx";

export type UsageSegment = {
  label: string;
  value: number;
  /** Default: accent for the first segment, neutral steps for the rest. */
  tone?: "accent" | "neutral";
};

export type UsageMeterProps = {
  segments: UsageSegment[];
  max: number;
  /** Heading above the bar; also names the meter. */
  label: ReactNode;
  /** Unit after the figures, e.g. "GB". */
  unit?: string;
  /** Share of max (0 to 1) where the meter turns warning. */
  warnAt?: number;
  /** Share of max (0 to 1) where the meter turns danger. */
  dangerAt?: number;
  format?: Intl.NumberFormatOptions;
  locale?: string;
  className?: string;
};

const LEAD = { ok: "bg-accent", warning: "bg-warning", danger: "bg-danger" } as const;
const FIGURE = { ok: "text-fg", warning: "text-warning-ink", danger: "text-danger-ink" } as const;
// Neutral steps of the fg ramp, darkest first, so the order of the legend reads in the bar.
const NEUTRAL = [
  "bg-[color-mix(in_oklab,var(--pl-fg)_55%,transparent)]",
  "bg-[color-mix(in_oklab,var(--pl-fg)_36%,transparent)]",
  "bg-[color-mix(in_oklab,var(--pl-fg)_22%,transparent)]",
];
const DEFAULT_FORMAT: Intl.NumberFormatOptions = { maximumFractionDigits: 1 };

export function UsageMeter({ segments, max, label, unit, warnAt = 0.8, dangerAt = 0.95, format = DEFAULT_FORMAT, locale, className }: UsageMeterProps) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();
  const fmt = useMemo(() => new Intl.NumberFormat(locale, format), [locale, format]);

  const used = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const ratio = max > 0 ? used / max : 0;
  const state = ratio >= dangerAt ? "danger" : ratio >= warnAt ? "warning" : "ok";
  const u = unit ? ` ${unit}` : "";

  let neutral = 0;
  const swatches = segments.map((s, i) => {
    const accent = s.tone ? s.tone === "accent" : i === 0;
    return accent ? LEAD[state] : NEUTRAL[Math.min(neutral++, NEUTRAL.length - 1)];
  });

  return (
    <div className={cn("flex w-full flex-col gap-2.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span id={id} className="text-body text-fg">
          {label}
        </span>
        <span className="pl-tabular shrink-0 text-subhead text-fg-muted" aria-hidden="true">
          <Odometer value={used} format={format} locale={locale} className={FIGURE[state]} /> of {fmt.format(max)}
          {u}
        </span>
      </div>
      <div
        ref={ref}
        role="meter"
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(used, max)}
        aria-valuetext={`${fmt.format(used)} of ${fmt.format(max)}${u} used, ${Math.round(ratio * 100)}%`}
        className="h-3 w-full overflow-hidden rounded-[0.25rem] bg-fill-2"
      >
        <div
          className="flex h-full gap-px ease-out ltr:origin-left rtl:origin-right motion-safe:transition-transform motion-safe:duration-(--pl-duration-slow)"
          style={{ transform: `scaleX(${reduced || inView ? 1 : 0})` }}
        >
          {segments.map((s, i) => (
            <span key={s.label} className={cn("h-full shrink-0", swatches[i])} style={{ width: `${(Math.max(0, s.value) / Math.max(max, used, 1)) * 100}%` }} />
          ))}
        </div>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-footnote">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", swatches[i])} />
            <span className="text-fg-muted">{s.label}</span>
            <span className="pl-tabular text-fg">
              <Odometer value={s.value} format={format} locale={locale} />
              {u}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
