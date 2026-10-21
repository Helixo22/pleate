// Alert: an inline message in the page — info, success, warning or danger — with an icon, a title, text, optional
// actions and an optional dismiss button. role="alert" for danger/warning (announced at once), "status" otherwise.
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "../../lib/cn.ts";
import { XIcon } from "../../lib/icons.tsx";

const alertVariants = cva("relative flex gap-3 rounded-2xl p-4 text-subhead [&>svg]:mt-px [&>svg]:size-5 [&>svg]:shrink-0", {
  variants: {
    tone: {
      info: "[--pl-a-ink:var(--pl-info-ink)] [--pl-a-soft:var(--pl-info-soft)]",
      success: "[--pl-a-ink:var(--pl-success-ink)] [--pl-a-soft:var(--pl-success-soft)]",
      warning: "[--pl-a-ink:var(--pl-warning-ink)] [--pl-a-soft:var(--pl-warning-soft)]",
      danger: "[--pl-a-ink:var(--pl-danger-ink)] [--pl-a-soft:var(--pl-danger-soft)]",
      accent: "[--pl-a-ink:var(--pl-accent-ink)] [--pl-a-soft:var(--pl-accent-soft)]",
      neutral: "[--pl-a-ink:var(--pl-fg-muted)] [--pl-a-soft:var(--pl-fill-2)]",
    },
    variant: {
      soft: "bg-(--pl-a-soft) text-fg [&>svg]:text-(--pl-a-ink)",
      surface: "bg-surface text-fg shadow-sm [&>svg]:text-(--pl-a-ink)",
      outline: "bg-transparent text-fg shadow-[inset_0_0_0_1px_var(--pl-separator)] [&>svg]:text-(--pl-a-ink)",
    },
  },
  defaultVariants: { tone: "info", variant: "soft" },
});

const ICONS = {
  info: <path d="M12 8h.01M11 12h1v5h1" />,
  success: <path d="M8 12.5l3 3 5-6" />,
  warning: <path d="M12 8v5M12 16.5h.01" />,
  danger: <path d="M9 9l6 6M15 9l-6 6" />,
  accent: <path d="M12 8h.01M11 12h1v5h1" />,
  neutral: <path d="M12 8h.01M11 12h1v5h1" />,
};

export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> &
  VariantProps<typeof alertVariants> & {
    ref?: Ref<HTMLDivElement>;
    title?: ReactNode;
    /** Custom icon, or false for none. */
    icon?: ReactNode | false;
    /** Buttons under the text. */
    actions?: ReactNode;
    onDismiss?: () => void;
    dismissLabel?: string;
  };

export function Alert({ className, tone = "info", variant, title, icon, actions, onDismiss, dismissLabel = "Dismiss", children, ...props }: AlertProps) {
  const urgent = tone === "danger" || tone === "warning";
  return (
    <div role={urgent ? "alert" : "status"} className={cn(alertVariants({ tone, variant }), onDismiss && "pe-12", className)} {...props}>
      {icon === false
        ? null
        : (icon ?? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9.25" />
              {ICONS[tone ?? "info"]}
            </svg>
          ))}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && <p className="text-headline text-fg">{title}</p>}
        {children && <div className="text-fg-muted">{children}</div>}
        {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className="pl-focus-ring absolute end-3 top-3 grid size-7 cursor-pointer place-items-center rounded-full text-fg-muted transition-colors hover:bg-fill-2 hover:text-fg [&_svg]:size-4"
        >
          <XIcon strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
