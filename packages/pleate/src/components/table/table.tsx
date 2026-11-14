// Table: data in rows and columns on a rounded surface. Comfortable or compact density, optional stripes, hover and
// sticky header. Sortable headers are buttons that announce their order (aria-sort). With stackOnMobile each row
// becomes a card on phones and every cell shows its column name (TableCell label).
"use client";

import { createContext, useContext, type HTMLAttributes, type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronUpIcon } from "../../lib/icons.tsx";
import { EmptyState } from "../empty-state/empty-state.tsx";
import { Skeleton } from "../skeleton/skeleton.tsx";

type TableOptions = { density: "comfortable" | "compact"; striped: boolean; hoverable: boolean; stackOnMobile: boolean };
const TableContext = createContext<TableOptions>({ density: "comfortable", striped: false, hoverable: true, stackOnMobile: false });

export type TableProps = HTMLAttributes<HTMLTableElement> &
  Partial<TableOptions> & {
    /** Keep the header visible while the table scrolls (needs a height on the wrapper). */
    stickyHeader?: boolean;
    /** Classes for the scrolling wrapper (e.g. a max height). */
    wrapperClassName?: string;
    /** Wrapper surface: a card, or none when the table sits inside your own card. */
    surface?: boolean;
    /** Replace the body rows with skeleton rows while data loads (set `columns` to the number of columns). */
    loading?: boolean;
    columns?: number;
    skeletonRows?: number;
    /** Shown instead of the body rows when there is nothing to list. */
    empty?: { icon?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode };
  };

export function Table({
  className,
  wrapperClassName,
  density = "comfortable",
  striped = false,
  hoverable = true,
  stackOnMobile = false,
  stickyHeader = false,
  surface = true,
  loading = false,
  columns = 4,
  skeletonRows = 4,
  empty,
  children,
  ...props
}: TableProps) {
  const replaced = loading || Boolean(empty);
  return (
    <TableContext.Provider value={{ density, striped, hoverable, stackOnMobile }}>
      <div
        className={cn(
          "relative w-full overflow-auto",
          surface && "rounded-2xl bg-surface shadow-[var(--pl-edge)]",
          stackOnMobile && surface && "max-md:rounded-none max-md:bg-transparent max-md:shadow-none",
          wrapperClassName,
        )}
        data-sticky={stickyHeader || undefined}
      >
        <table
          className={cn(
            "w-full caption-bottom border-separate border-spacing-0 text-start text-subhead text-fg",
            stackOnMobile && "max-md:block",
            replaced && "[&>tbody:not([data-replacement])]:hidden",
            className,
          )}
          aria-busy={loading || undefined}
          {...props}
        >
          {children}
          {loading ? (
            <tbody data-replacement>
              {Array.from({ length: skeletonRows }, (_, i) => (
                <tr key={i}>
                  {Array.from({ length: columns }, (_, c) => (
                    <td key={c} className={cn("border-b border-separator px-4 align-middle", density === "compact" ? "h-10" : "h-13")}>
                      <Skeleton shape="text" className="inline-block text-subhead" width={`${[70, 55, 40, 60, 50][(i + c) % 5]}%`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : (
            empty && (
              <tbody data-replacement>
                <tr>
                  <td colSpan={999}>
                    <EmptyState size="sm" icon={empty.icon} title={empty.title} description={empty.description} actions={empty.actions} />
                  </td>
                </tr>
              </tbody>
            )
          )}
        </table>
      </div>
    </TableContext.Provider>
  );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  const { stackOnMobile } = useContext(TableContext);
  return (
    <thead
      className={cn(
        "[[data-sticky]_&_th]:sticky [[data-sticky]_&_th]:top-0 [[data-sticky]_&_th]:z-10 [[data-sticky]_&_th]:bg-surface",
        stackOnMobile && "max-md:sr-only",
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  const { stackOnMobile } = useContext(TableContext);
  return <tbody className={cn(stackOnMobile && "max-md:flex max-md:flex-col max-md:gap-3", className)} {...props} />;
}

export function TableFooter({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className={cn("font-medium [&_td]:border-t [&_td]:border-separator", className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  const { striped, hoverable, stackOnMobile } = useContext(TableContext);
  return (
    <tr
      className={cn(
        "group/row transition-colors duration-(--pl-duration-instant)",
        striped && "[tbody_&:nth-child(even)]:bg-fill-3",
        hoverable && "[tbody_&]:hover:bg-fill-3",
        "data-[state=selected]:bg-accent-soft",
        "[tbody_&:last-child_td]:border-b-0",
        stackOnMobile && "max-md:flex max-md:flex-col max-md:rounded-2xl max-md:bg-surface max-md:p-1 max-md:shadow-[var(--pl-edge)]",
        className,
      )}
      {...props}
    />
  );
}

export type TableHeadProps = Omit<ThHTMLAttributes<HTMLTableCellElement>, "align"> & {
  /** Current sort of this column; makes the header a button. */
  sort?: "asc" | "desc" | false;
  onSort?: () => void;
  align?: "start" | "center" | "end";
};

const ALIGN = { start: "text-start", center: "text-center", end: "text-end" } as const;

export function TableHead({ className, sort, onSort, align = "start", children, ...props }: TableHeadProps) {
  const { density } = useContext(TableContext);
  const sortable = onSort !== undefined;
  return (
    <th
      scope="col"
      aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : sortable ? "none" : undefined}
      className={cn(
        "group/head border-b border-separator text-footnote font-medium whitespace-nowrap text-fg-muted",
        density === "compact" ? "h-9 px-3" : "h-11 px-4",
        ALIGN[align],
        className,
      )}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          className={cn(
            "pl-focus-ring pl-hit relative -mx-1.5 inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 hover:text-fg",
            sort && "text-fg",
          )}
        >
          {children}
          <ChevronUpIcon
            className={cn(
              "size-3.5 transition-[rotate,opacity] duration-(--pl-duration-fast)",
              sort === "desc" && "rotate-180",
              !sort && "opacity-0 group-hover/head:opacity-40",
            )}
            strokeWidth={2.75}
          />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export type TableCellProps = Omit<TdHTMLAttributes<HTMLTableCellElement>, "align"> & {
  /** Column name shown before the value when rows stack on phones. */
  label?: ReactNode;
  align?: "start" | "center" | "end";
};

export function TableCell({ className, label, align = "start", children, ...props }: TableCellProps) {
  const { density, stackOnMobile } = useContext(TableContext);
  return (
    <td
      className={cn(
        "border-b border-separator align-middle",
        density === "compact" ? "h-10 px-3 py-1.5" : "h-13 px-4 py-2.5",
        ALIGN[align],
        stackOnMobile && "max-md:flex max-md:h-auto max-md:items-center max-md:justify-between max-md:gap-4 max-md:px-3 max-md:py-2 max-md:text-end max-md:last:border-b-0",
        className,
      )}
      {...props}
    >
      {stackOnMobile && label && <span className="shrink-0 text-start text-footnote font-medium text-fg-muted md:hidden">{label}</span>}
      {children}
    </td>
  );
}

export function TableCaption({ className, ...props }: HTMLAttributes<HTMLTableCaptionElement>) {
  const { stackOnMobile } = useContext(TableContext);
  return <caption className={cn("px-4 py-3 text-start text-footnote text-fg-muted", stackOnMobile && "max-md:block max-md:px-1", className)} {...props} />;
}
