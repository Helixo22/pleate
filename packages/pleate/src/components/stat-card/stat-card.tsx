// StatCard: one number that matters — label, value (counting up into view), change against a previous period
// with a colored trend, an optional icon tile and a sparkline drawn from your data.
"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type StatCardProps = {
  label: ReactNode;
  value: number;
  /** Formats the (animated) number, e.g. v => `€${v.toFixed(0)}`. */
  format?: (value: number) => string;
  /** Relative change, e.g. 0.124 for +12.4%. */
  delta?: number;
  /** Text after the change ("vs last month"). */
  deltaLabel?: ReactNode;
  /** For metrics where going down is good (costs, errors). */
  invertTrend?: boolean;
  icon?: ReactNode;
  /** Values for the sparkline, oldest first. */
  trend?: number[];
  /** Count up from 0 when it scrolls into view (default true). */
  animated?: boolean;
  className?: string;
};

const percent = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1, signDisplay: "always" });

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const id = useId();
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data.map((v, i) => [(i / (data.length - 1)) * 100, 30 - ((v - min) / span) * 26 - 2] as const);
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={cn("h-10 w-full overflow-visible", className)} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L100 32 L0 32 Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  format = (v) => Math.round(v).toLocaleString(),
  delta,
  deltaLabel,
  invertTrend = false,
  icon,
  trend,
  animated = true,
  className,
}: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(animated ? 0 : value);

  useEffect(() => {
    if (!animated || reduced) {
      setShown(value);
      return;
    }
    if (!inView) return;
    const controls = animate(0, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1], onUpdate: setShown });
    return () => controls.stop();
  }, [animated, reduced, inView, value]);

  const good = delta === undefined ? null : invertTrend ? delta <= 0 : delta >= 0;
  return (
    <div ref={ref} className={cn("flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-xs", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-subhead font-medium text-fg-muted">{label}</span>
        {icon && <span className="grid size-8 place-items-center rounded-lg bg-accent-soft text-accent-ink [&_svg]:size-[1.125rem]">{icon}</span>}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="pl-tabular text-large-title tracking-tight text-fg">
          {/* Screen readers get the final value, not every animation frame. */}
          <span aria-hidden="true">{format(shown)}</span>
          <span className="sr-only">{format(value)}</span>
        </span>
        {delta !== undefined && (
          <span className="flex items-center gap-1 text-footnote">
            <span
              className={cn(
                "pl-tabular inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
                good ? "bg-success-soft text-success-ink" : "bg-danger-soft text-danger-ink",
              )}
            >
              <svg viewBox="0 0 12 12" className={cn("size-2.5", delta < 0 && "rotate-180")} aria-hidden="true">
                <path d="M6 2l4 5H2z" fill="currentColor" />
              </svg>
              {percent.format(delta)}
            </span>
            {deltaLabel && <span className="text-fg-muted">{deltaLabel}</span>}
          </span>
        )}
      </div>
      {trend && <Sparkline data={trend} className="text-accent-ink" />}
    </div>
  );
}
