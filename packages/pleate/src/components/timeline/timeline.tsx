// Timeline: events in order along a line. Each item has a marker (dot, icon or number), a time, a title and
// details; status colors the marker and the line ("done" filled, "current" ringed, "upcoming" hollow).
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { CheckIcon } from "../../lib/icons.tsx";

export function Timeline({ className, ...props }: HTMLAttributes<HTMLOListElement>) {
  return <ol className={cn("flex w-full flex-col", className)} {...props} />;
}

export type TimelineItemProps = Omit<HTMLAttributes<HTMLLIElement>, "title"> & {
  title: ReactNode;
  time?: ReactNode;
  description?: ReactNode;
  /** Custom marker content (an icon); defaults to a dot, or a check when done. */
  icon?: ReactNode;
  status?: "done" | "current" | "upcoming";
  tone?: "accent" | "success" | "warning" | "danger";
};

const TONE = {
  accent: { fill: "bg-accent text-on-accent", ring: "ring-accent-ink", line: "bg-accent", ink: "text-accent-ink" },
  success: { fill: "bg-success text-on-status", ring: "ring-success-ink", line: "bg-success", ink: "text-success-ink" },
  warning: { fill: "bg-warning text-on-status", ring: "ring-warning-ink", line: "bg-warning", ink: "text-warning-ink" },
  danger: { fill: "bg-danger text-on-status", ring: "ring-danger-ink", line: "bg-danger", ink: "text-danger-ink" },
};

export function TimelineItem({ title, time, description, icon, status = "done", tone = "accent", className, children, ...props }: TimelineItemProps) {
  const t = TONE[tone];
  return (
    <li
      aria-current={status === "current" ? "step" : undefined}
      className={cn("group/tl relative flex gap-4 pb-7 last:pb-0", className)}
      {...props}
    >
      {/* connector to the next item */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute start-[0.6875rem] top-7 bottom-1 w-0.5 rounded-full group-last/tl:hidden",
          status === "done" ? t.line : "bg-separator",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "relative z-[1] mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-caption2 font-bold [&_svg]:size-3.5",
          status === "done" && t.fill,
          status === "current" && cn("bg-surface ring-2 ring-offset-0", t.ring, t.ink),
          status === "upcoming" && "bg-surface ring-2 ring-separator",
        )}
      >
        {icon ?? (status === "done" ? <CheckIcon strokeWidth={3} /> : status === "current" ? <span className={cn("size-2 rounded-full", t.line)} /> : null)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {time && <span className={cn("text-footnote", status === "current" ? cn("font-semibold", t.ink) : "text-fg-muted")}>{time}</span>}
        <span className={cn("text-headline", status === "upcoming" ? "text-fg-muted" : "text-fg")}>{title}</span>
        {description && <div className="text-subhead text-fg-muted">{description}</div>}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </li>
  );
}
