// Badge: a small read-only label for status and counts, solid, soft or outlined, in six tones, with an optional dot.
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, Ref } from "react";
import { cn } from "../../lib/cn.ts";

export const badgeVariants = cva(
  "pl-tabular inline-flex shrink-0 items-center justify-center gap-1 rounded-full font-semibold whitespace-nowrap",
  {
    variants: {
      variant: { solid: "", soft: "", outline: "bg-transparent" },
      tone: { accent: "", neutral: "", success: "", warning: "", danger: "", info: "" },
      size: {
        sm: "h-[1.125rem] min-w-[1.125rem] px-1.5 text-caption2",
        md: "h-[1.375rem] min-w-[1.375rem] px-2 text-caption1",
        lg: "h-7 min-w-7 px-2.5 text-footnote",
      },
    },
    compoundVariants: [
      { variant: "solid", tone: "accent", className: "bg-accent text-on-accent" },
      { variant: "solid", tone: "neutral", className: "bg-fg text-bg" },
      { variant: "solid", tone: "success", className: "bg-success text-on-status" },
      { variant: "solid", tone: "warning", className: "bg-warning text-on-status" },
      { variant: "solid", tone: "danger", className: "bg-danger text-on-status" },
      { variant: "solid", tone: "info", className: "bg-info text-on-status" },
      { variant: "soft", tone: "accent", className: "bg-accent-soft text-accent-ink" },
      { variant: "soft", tone: "neutral", className: "bg-fill-2 text-fg-muted" },
      { variant: "soft", tone: "success", className: "bg-success-soft text-success-ink" },
      { variant: "soft", tone: "warning", className: "bg-warning-soft text-warning-ink" },
      { variant: "soft", tone: "danger", className: "bg-danger-soft text-danger-ink" },
      { variant: "soft", tone: "info", className: "bg-info-soft text-info-ink" },
      { variant: "outline", tone: "accent", className: "text-accent-ink shadow-[inset_0_0_0_1px_currentColor]" },
      { variant: "outline", tone: "neutral", className: "text-fg-muted shadow-[inset_0_0_0_1px_var(--pl-border)]" },
      { variant: "outline", tone: "success", className: "text-success-ink shadow-[inset_0_0_0_1px_currentColor]" },
      { variant: "outline", tone: "warning", className: "text-warning-ink shadow-[inset_0_0_0_1px_currentColor]" },
      { variant: "outline", tone: "danger", className: "text-danger-ink shadow-[inset_0_0_0_1px_currentColor]" },
      { variant: "outline", tone: "info", className: "text-info-ink shadow-[inset_0_0_0_1px_currentColor]" },
    ],
    defaultVariants: { variant: "soft", tone: "accent", size: "md" },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    ref?: Ref<HTMLSpanElement>;
    /** A leading status dot in the text color. */
    dot?: boolean;
  };

export function Badge({ className, variant, tone, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, tone, size }), className)} {...props}>
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
