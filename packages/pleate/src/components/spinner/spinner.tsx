// Spinner: a thin ring with a rotating arc in currentColor. Announces itself as a status with a label.
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";

const SIZES = { xs: 14, sm: 16, md: 20, lg: 28, xl: 40 } as const;

export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  size?: keyof typeof SIZES | number;
  /** Accessible name; set `label={null}` when a parent already announces the busy state. */
  label?: string | null;
};

export function Spinner({ size = "md", label = "Loading", className, style, ...props }: SpinnerProps) {
  const px = typeof size === "number" ? size : SIZES[size];
  return (
    <span
      {...(label ? { role: "status", "aria-label": label } : { "aria-hidden": true })}
      className={cn("relative inline-block shrink-0 text-current", className)}
      style={{ width: px, height: px, ...style }}
      {...props}
    >
      <svg viewBox="0 0 24 24" className="size-full animate-[pl-spin_0.7s_linear_infinite]" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="9.5" opacity="0.2" />
        <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
