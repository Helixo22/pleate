// Rating: stars from 1 to max. Interactive it is a radio group (arrow keys move and select, hovering previews the
// score); readOnly it is a single image that can show halves, e.g. an average of 4.5. Filled stars use the accent ink.
"use client";

import { RadioGroup } from "radix-ui";
import { useState } from "react";
import { cn } from "../../lib/cn.ts";
import { useControllableState } from "../../lib/use-controllable-state.ts";

export type RatingProps = {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  max?: number;
  /** Display only; allows fractional values. */
  readOnly?: boolean;
  /** Round a readOnly value to halves instead of whole stars. */
  allowHalf?: boolean;
  size?: "sm" | "md";
  /** Shows the number next to the stars. */
  showValue?: boolean;
  disabled?: boolean;
  name?: string;
  "aria-label"?: string;
  className?: string;
};

const STAR = "M12 3.2l2.7 5.5 6 .9-4.35 4.25 1.03 6-5.38-2.83-5.38 2.83 1.03-6L3.3 9.6l6-.9L12 3.2z";

function Star({ fill, className }: { fill: number; className?: string }) {
  return (
    <span className={cn("relative block shrink-0", className)}>
      <svg viewBox="0 0 24 24" className="size-full text-fg-subtle" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" aria-hidden="true">
        <path d={STAR} />
      </svg>
      {fill > 0 && (
        <span className="absolute inset-y-0 start-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
          <svg viewBox="0 0 24 24" className="h-full text-accent-ink" style={{ width: `${100 / fill}%` }} fill="currentColor" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" aria-hidden="true">
            <path d={STAR} />
          </svg>
        </span>
      )}
    </span>
  );
}

const SIZE = { sm: { star: "size-4", text: "text-footnote" }, md: { star: "size-5", text: "text-subhead" } } as const;

export function Rating({
  value,
  defaultValue = 0,
  onValueChange,
  max = 5,
  readOnly = false,
  allowHalf = false,
  size = "md",
  showValue = false,
  disabled,
  name,
  className,
  ...props
}: RatingProps) {
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const [hover, setHover] = useState<number | null>(null);
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const label = props["aria-label"] ?? "Rating";
  const number = showValue && (
    <span className={cn("ms-2 font-mono text-fg-muted pl-tabular", SIZE[size].text)} aria-hidden="true">
      {readOnly ? current.toFixed(1) : current}
    </span>
  );

  if (readOnly) {
    const shown = allowHalf ? Math.round(current * 2) / 2 : Math.round(current);
    return (
      <span role="img" aria-label={`${label}: ${current} out of ${max}`} className={cn("inline-flex items-center gap-0.5", className)}>
        {stars.map((n) => (
          <Star key={n} fill={Math.min(1, Math.max(0, shown - n + 1))} className={SIZE[size].star} />
        ))}
        {number}
      </span>
    );
  }

  const lit = hover ?? current;
  return (
    <span className={cn("inline-flex items-center", className)}>
      <RadioGroup.Root
        value={current ? String(current) : ""}
        onValueChange={(v) => setCurrent(Number(v))}
        orientation="horizontal"
        disabled={disabled}
        name={name}
        aria-label={label}
        onPointerLeave={() => setHover(null)}
        className={cn("inline-flex items-center", disabled && "opacity-50")}
      >
        {stars.map((n) => (
          <RadioGroup.Item
            key={n}
            value={String(n)}
            aria-label={`${n} of ${max}`}
            onPointerEnter={() => !disabled && setHover(n)}
            className="pl-focus-ring pl-touch cursor-pointer rounded-xs p-0.5 disabled:cursor-not-allowed motion-safe:active:[&>span]:scale-90 [&>span]:transition-[scale] [&>span]:duration-(--pl-duration-fast)"
          >
            <Star fill={n <= lit ? 1 : 0} className={SIZE[size].star} />
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
      {number}
    </span>
  );
}
