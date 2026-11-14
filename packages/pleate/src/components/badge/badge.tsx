// Badge: a small read-only label for status and counts, solid, soft or outlined (aliases: filled, tinted), in six tones, with an optional dot.
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, Ref } from "react";
import { cn } from "../../lib/cn.ts";

export const badgeVariants = cva(
  "pl-tabular inline-flex shrink-0 items-center justify-center gap-1 rounded-full font-medium whitespace-nowrap",
  {
    variants: {
      variant: { solid: "", soft: "", outline: "bg-transparent", filled: "", tinted: "" },
      tone: { accent: "", neutral: "", success: "", warning: "", danger: "", info: "" },
      size: {
        sm: "h-[1.125rem] min-w-[1.125rem] px-1 text-caption2",
        md: "h-5 min-w-5 px-1.5 text-caption1",
        lg: "h-6 min-w-6 px-2 text-footnote",
      },
    },
    compoundVariants: [
      { variant: ["solid", "filled"], tone: "accent", className: "bg-accent text-on-accent" },
      { variant: ["solid", "filled"], tone: "neutral", className: "bg-fg text-bg" },
      { variant: ["solid", "filled"], tone: "success", className: "bg-success text-on-status" },
      { variant: ["solid", "filled"], tone: "warning", className: "bg-warning text-on-status" },
      { variant: ["solid", "filled"], tone: "danger", className: "bg-danger text-on-status" },
      { variant: ["solid", "filled"], tone: "info", className: "bg-info text-on-status" },
      { variant: ["soft", "tinted"], tone: "accent", className: "bg-accent-soft text-accent-ink" },
      { variant: ["soft", "tinted"], tone: "neutral", className: "bg-fill-2 text-fg-muted" },
      { variant: ["soft", "tinted"], tone: "success", className: "bg-success-soft text-success-ink" },
      { variant: ["soft", "tinted"], tone: "warning", className: "bg-warning-soft text-warning-ink" },
      { variant: ["soft", "tinted"], tone: "danger", className: "bg-danger-soft text-danger-ink" },
      { variant: ["soft", "tinted"], tone: "info", className: "bg-info-soft text-info-ink" },
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
    /** A number to show instead of children; above `max` it reads "99+". */
    count?: number;
    /** Largest number shown as is. */
    max?: number;
  };

export function Badge({ className, variant, tone, size, dot, count, max = 99, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, tone, size }), className)} {...props}>
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {count === undefined ? children : count > max ? `${max}+` : count}
    </span>
  );
}
