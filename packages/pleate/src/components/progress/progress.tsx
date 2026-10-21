// Progress: how far a task has got. A linear bar (Radix Progress) or a ring (ProgressCircle) with content in the
// middle; both have an indeterminate mode when the total is unknown (value={null}).
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Progress as Primitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

const TONE = {
  accent: "bg-accent",
  success: "bg-success-vivid",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-fg",
} as const;
const STROKE = {
  accent: "stroke-accent",
  success: "stroke-success-vivid",
  warning: "stroke-warning",
  danger: "stroke-danger",
  neutral: "stroke-fg",
} as const;
type Tone = keyof typeof TONE;

const trackVariants = cva("relative w-full overflow-hidden rounded-full bg-fill", {
  variants: { size: { sm: "h-1", md: "h-1.5", lg: "h-2.5" } },
  defaultVariants: { size: "md" },
});

export type ProgressProps = VariantProps<typeof trackVariants> & {
  /** 0…max; null for indeterminate. */
  value: number | null;
  max?: number;
  tone?: Tone;
  label?: ReactNode;
  /** Show the percentage (or your own text) next to the label. */
  valueLabel?: ReactNode | boolean;
  className?: string;
  "aria-label"?: string;
};

export function Progress({ value, max = 100, size, tone = "accent", label, valueLabel, className, ...props }: ProgressProps) {
  const pct = value === null ? null : Math.min(100, Math.max(0, (value / max) * 100));
  const shown = valueLabel === true ? (pct === null ? null : `${Math.round(pct)}%`) : valueLabel || null;
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {(label || shown) && (
        <div className="flex items-baseline justify-between gap-3 text-footnote">
          {label && <span className="font-medium text-fg">{label}</span>}
          {shown && <span className="pl-tabular ms-auto text-fg-muted">{shown}</span>}
        </div>
      )}
      <Primitive.Root value={value} max={max} aria-label={props["aria-label"] ?? (typeof label === "string" ? label : undefined)} className={trackVariants({ size })}>
        <Primitive.Indicator
          className={cn(
            "h-full rounded-full",
            TONE[tone],
            pct === null
              ? "w-2/5 motion-safe:animate-[pl-indeterminate_1.4s_var(--pl-ease-in-out)_infinite]"
              : "transition-[width] duration-(--pl-duration-slow) ease-ios",
          )}
          style={pct === null ? undefined : { width: `${pct}%` }}
        />
      </Primitive.Root>
    </div>
  );
}

export type ProgressCircleProps = {
  value: number | null;
  max?: number;
  /** Diameter in px. */
  size?: number;
  /** Ring thickness in px. */
  thickness?: number;
  tone?: Tone;
  /** Center content (defaults to nothing; pass e.g. the percentage). */
  children?: ReactNode;
  className?: string;
  "aria-label"?: string;
};

export function ProgressCircle({ value, max = 100, size = 48, thickness = 4, tone = "accent", children, className, ...props }: ProgressCircleProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = value === null ? null : Math.min(1, Math.max(0, value / max));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value ?? undefined}
      aria-label={props["aria-label"]}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn("-rotate-90", pct === null && "motion-safe:animate-[pl-spin_1s_linear_infinite]")}
        aria-hidden="true"
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className="stroke-fill" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={pct === null ? c * 0.72 : c * (1 - pct)}
          className={cn(STROKE[tone], "transition-[stroke-dashoffset] duration-(--pl-duration-slow) ease-ios")}
        />
      </svg>
      {children && <div className="pl-tabular absolute inset-0 grid place-items-center text-footnote font-semibold">{children}</div>}
    </div>
  );
}
