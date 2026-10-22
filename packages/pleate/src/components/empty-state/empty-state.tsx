// EmptyState: what to show when there is nothing yet, an icon in a soft tile (or your illustration), a title,
// one helpful sentence and the action that fixes it.
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export type EmptyStateProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  icon?: ReactNode;
  /** Replaces the icon tile with a larger visual. */
  illustration?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Draw it on a dashed surface (drop zones, empty panels). */
  bordered?: boolean;
};

const SIZE = {
  sm: { root: "gap-2 py-6", tile: "size-10 rounded-xl [&_svg]:size-5", title: "text-headline", text: "text-footnote" },
  md: { root: "gap-3 py-10", tile: "size-14 rounded-2xl [&_svg]:size-7", title: "text-title3", text: "text-subhead" },
  lg: { root: "gap-4 py-16", tile: "size-20 rounded-3xl [&_svg]:size-10", title: "text-title2", text: "text-body" },
};

export function EmptyState({ icon, illustration, title, description, actions, size = "md", bordered, className, ...props }: EmptyStateProps) {
  const s = SIZE[size];
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center px-6 text-center",
        s.root,
        bordered && "rounded-3xl border-2 border-dashed border-separator",
        className,
      )}
      {...props}
    >
      {illustration ?? (icon && <span className={cn("mb-1 grid place-items-center bg-accent-soft text-accent-ink", s.tile)}>{icon}</span>)}
      <h3 className={cn("text-balance text-fg", s.title)}>{title}</h3>
      {description && <p className={cn("max-w-sm text-pretty text-fg-muted", s.text)}>{description}</p>}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
