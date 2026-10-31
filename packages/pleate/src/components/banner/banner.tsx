// Banner: a full-width announcement bar for the top of a page or app, neutral, accent, warning or danger, with an
// optional icon, action and dismiss button. Dismissing collapses the height (grid rows 1fr to 0fr) and then calls
// onDismiss; with reduced motion it goes at once. A labelled region, not an alert: it is there on load, not news.
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useState, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "../../lib/cn.ts";
import { XIcon } from "../../lib/icons.tsx";
import { closeButton } from "../../lib/overlay-styles.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

const bannerVariants = cva(
  "flex min-h-10 items-center gap-x-3 gap-y-1 px-4 py-2 text-footnote text-fg shadow-[inset_0_-1px_0_var(--pl-separator)] [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "bg-surface-2 [&>svg]:text-fg-muted",
        accent: "bg-accent-soft [&>svg]:text-accent-ink",
        warning: "bg-warning-soft [&>svg]:text-warning-ink",
        danger: "bg-danger-soft [&>svg]:text-danger-ink",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BannerProps = Omit<HTMLAttributes<HTMLElement>, "role"> &
  VariantProps<typeof bannerVariants> & {
    ref?: Ref<HTMLElement>;
    /** Names the region for screen readers. */
    "aria-label"?: string;
    icon?: ReactNode;
    /** A link or a small button after the text. */
    action?: ReactNode;
    dismissible?: boolean;
    /** Called once the bar has collapsed. */
    onDismiss?: () => void;
    dismissLabel?: string;
    /** Stick to the top of the scroll container. */
    sticky?: boolean;
  };

export function Banner({
  className,
  tone,
  icon,
  action,
  dismissible = false,
  onDismiss,
  dismissLabel = "Dismiss",
  sticky = false,
  children,
  "aria-label": label = "Announcement",
  ...props
}: BannerProps) {
  const [state, setState] = useState<"open" | "closing" | "closed">("open");
  const reduced = useReducedMotion();
  if (state === "closed") return null;

  const close = () => {
    setState("closed");
    onDismiss?.();
  };

  return (
    <div
      className={cn("grid transition-[grid-template-rows,opacity] duration-(--pl-duration-base) ease-out", sticky && "sticky top-0 z-(--pl-z-sticky)")}
      style={{ gridTemplateRows: state === "open" ? "1fr" : "0fr", opacity: state === "open" ? 1 : 0 }}
      onTransitionEnd={(e) => e.target === e.currentTarget && e.propertyName === "grid-template-rows" && state === "closing" && close()}
      inert={state === "closing" || undefined}
    >
      <div className="min-h-0 overflow-hidden">
        <section role="region" aria-label={label} className={cn(bannerVariants({ tone }), dismissible && "pe-2", className)} {...props}>
          {icon}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
            <div className="min-w-0">{children}</div>
            {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
          </div>
          {dismissible && (
            <button type="button" aria-label={dismissLabel} onClick={() => (reduced ? close() : setState("closing"))} className={closeButton}>
              <XIcon strokeWidth={2} />
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
