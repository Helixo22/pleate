// Divider: a hairline between content. Horizontal or vertical, optionally inset from the start like iOS list rows,
// or with a centered label ("or"). Decorative by default; pass decorative={false} for a semantic separator.
"use client";

import { Separator } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export type DividerProps = Omit<ComponentProps<typeof Separator.Root>, "children"> & {
  /** Start inset in spacing steps (×0.25rem), e.g. 14 to align with text after an icon. */
  inset?: number;
  label?: ReactNode;
  /** Thicker, spaced separator between groups of content. */
  spacing?: "none" | "sm" | "md" | "lg";
};

const SPACING = {
  horizontal: { none: "", sm: "my-2", md: "my-4", lg: "my-8" },
  vertical: { none: "", sm: "mx-2", md: "mx-4", lg: "mx-8" },
} as const;

export function Divider({
  className,
  orientation = "horizontal",
  decorative = true,
  inset,
  label,
  spacing = "none",
  style,
  ...props
}: DividerProps) {
  if (label && orientation === "horizontal") {
    return (
      <div className={cn("flex items-center gap-3 text-footnote text-fg-muted", SPACING.horizontal[spacing], className)} style={style}>
        <Separator.Root decorative className="h-px flex-1 bg-separator" />
        <span className="shrink-0">{label}</span>
        <Separator.Root decorative className="h-px flex-1 bg-separator" />
      </div>
    );
  }
  return (
    <Separator.Root
      orientation={orientation}
      decorative={decorative}
      className={cn(
        "shrink-0 bg-separator",
        orientation === "horizontal" ? "h-px w-auto" : "w-px self-stretch",
        SPACING[orientation][spacing],
        className,
      )}
      style={inset ? { marginInlineStart: `calc(var(--spacing) * ${inset})`, ...style } : style}
      {...props}
    />
  );
}
