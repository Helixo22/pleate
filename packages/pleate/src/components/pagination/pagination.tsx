// Pagination: move through pages. "pages" shows numbers with ellipses (fewer on phones), "compact" a
// "3 of 12" label between arrows, "dots" the iOS page control. On phones "pages" keeps first, current and last. Pages are buttons (onPageChange) or links (getHref).
"use client";

import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronRightIcon } from "../../lib/icons.tsx";

export type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
  /** Turn pages into links. */
  getHref?: (page: number) => string;
  variant?: "pages" | "compact" | "dots";
  /** Pages shown on each side of the current one. */
  siblings?: number;
  size?: "sm" | "md";
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
  /** Text of the compact variant. */
  formatLabel?: (page: number, pageCount: number) => ReactNode;
  className?: string;
};

/** The page numbers to show, with "…" for gaps. Always keeps first, last and `siblings` around the current one. */
export function paginationRange(page: number, pageCount: number, siblings = 1): (number | "…")[] {
  const total = siblings * 2 + 5;
  if (pageCount <= total) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const start = Math.max(2, page - siblings);
  const end = Math.min(pageCount - 1, page + siblings);
  const left = start > 2;
  const right = end < pageCount - 1;
  if (!left) return [...Array.from({ length: siblings * 2 + 3 }, (_, i) => i + 1), "…", pageCount];
  if (!right) return [1, "…", ...Array.from({ length: siblings * 2 + 3 }, (_, i) => pageCount - siblings * 2 - 2 + i)];
  return [1, "…", ...Array.from({ length: end - start + 1 }, (_, i) => start + i), "…", pageCount];
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  getHref,
  variant = "pages",
  siblings = 1,
  size = "md",
  label = "Pagination",
  previousLabel = "Previous page",
  nextLabel = "Next page",
  formatLabel = (p, n) => `${p} of ${n}`,
  className,
}: PaginationProps) {
  const box = size === "sm" ? "h-8 min-w-8 text-footnote" : "h-9 min-w-9 text-subhead sm:h-10 sm:min-w-10";
  const cell = (target: number, content: ReactNode, extra: { label?: string; current?: boolean; disabled?: boolean; className?: string } = {}) => {
    const classes = cn(
      "pl-focus-ring pl-touch inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full px-2 font-semibold pl-tabular",
      "transition-colors duration-(--pl-duration-fast)",
      box,
      extra.current ? "bg-accent text-on-accent" : "text-fg hover:bg-fill-2",
      extra.disabled && "pointer-events-none opacity-30",
      extra.className,
    );
    const common = { "aria-label": extra.label, "aria-current": extra.current ? ("page" as const) : undefined, className: classes };
    if (getHref && !extra.disabled) return <a href={getHref(target)} {...common} onClick={() => onPageChange?.(target)}>{content}</a>;
    return (
      <button type="button" disabled={extra.disabled} onClick={() => onPageChange?.(target)} {...common}>
        {content}
      </button>
    );
  };
  const arrow = (dir: -1 | 1) =>
    cell(
      page + dir,
      <ChevronRightIcon className={cn("size-[1.125rem]", dir < 0 ? "rotate-180 rtl:rotate-0" : "rtl:rotate-180")} strokeWidth={2.5} />,
      { label: dir < 0 ? previousLabel : nextLabel, disabled: dir < 0 ? page <= 1 : page >= pageCount, className: "text-accent-ink" },
    );

  if (variant === "dots") {
    return (
      <nav aria-label={label} className={cn("flex items-center justify-center", className)}>
        <ul className="flex items-center gap-2 rounded-full px-2 py-1.5">
          {Array.from({ length: pageCount }, (_, i) => {
            const p = i + 1;
            const current = p === page;
            return (
              <li key={p}>
                <button
                  type="button"
                  aria-label={`Page ${p}`}
                  aria-current={current ? "page" : undefined}
                  onClick={() => onPageChange?.(p)}
                  className="pl-focus-ring relative grid h-4 cursor-pointer place-items-center rounded-full after:absolute after:-inset-1.5"
                >
                  <span
                    className={cn(
                      "block h-2 rounded-full transition-[width,background-color] duration-(--pl-duration-base) ease-ios",
                      current ? "w-5 bg-fg" : "w-2 bg-fg-subtle/50 hover:bg-fg-subtle",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label={label} className={cn("flex items-center", className)}>
      <ul className="flex items-center gap-1">
        <li>{arrow(-1)}</li>
        {variant === "compact" ? (
          <li className={cn("px-3 font-medium text-fg-muted pl-tabular", size === "sm" ? "text-footnote" : "text-subhead")} aria-live="polite">
            {formatLabel(page, pageCount)}
          </li>
        ) : (
          <>
            {paginationRange(page, pageCount, siblings).map((item, i) =>
              item === "…" ? (
                <li key={`gap-${i}`} aria-hidden="true" className={cn("grid place-items-center text-fg-subtle", box)}>
                  …
                </li>
              ) : (
                // Phones keep first, current and last only.
                <li key={item} className={cn(item !== page && item !== 1 && item !== pageCount && "max-sm:hidden")}>
                  {cell(item, item, { current: item === page, label: `Page ${item}` })}
                </li>
              ),
            )}
          </>
        )}
        <li>{arrow(1)}</li>
      </ul>
    </nav>
  );
}
