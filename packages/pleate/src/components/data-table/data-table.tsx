// DataTable: a server-friendly table built from Table, SearchBar, Pagination, Skeleton and EmptyState. It renders
// what you pass and reports what the user asks for: sorting (onSortChange), searching (onSearchChange, debounced),
// paging (onPageChange) and selection (onSelectionChange), so the data can come from any API. Toolbar slot for
// filters, skeleton rows while loading, an empty state, clickable rows. Wide tables scroll sideways inside the card,
// never the page.
"use client";

import { type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { Checkbox } from "../checkbox/checkbox.tsx";
import { EmptyState } from "../empty-state/empty-state.tsx";
import { Pagination } from "../pagination/pagination.tsx";
import { SearchBar } from "../search-bar/search-bar.tsx";
import { Skeleton } from "../skeleton/skeleton.tsx";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../table/table.tsx";

export type SortDirection = "asc" | "desc";
export type DataTableSort = { key: string; direction: SortDirection };

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  /** Cell content; defaults to row[key]. */
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: "start" | "center" | "end";
  /** CSS width of the column ("12rem", "30%"). */
  width?: string;
  /** Keep the cell on one line. */
  nowrap?: boolean;
  className?: string;
};

export type DataTableLabels = {
  search?: string;
  searchPlaceholder?: string;
  selectAll?: string;
  selectRow?: (id: string) => string;
  selected?: (count: number) => string;
  loading?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  noResultsTitle?: string;
  noResultsDescription?: (query: string) => string;
};

const L = {
  search: "Search",
  searchPlaceholder: "Search",
  selectAll: "Select all rows on this page",
  selectRow: (id: string) => `Select row ${id}`,
  selected: (n: number) => `${n} selected`,
  loading: "Loading",
  emptyTitle: "Nothing here yet",
  emptyDescription: "Items will appear here once they are created.",
  noResultsTitle: "No results",
  noResultsDescription: (q: string) => `Nothing matches "${q}". Try another search.`,
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  sort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;
  /** Initial search text (the field is uncontrolled while typing). */
  search?: string;
  /** Shows the search field; called after the user stops typing for debounceMs. */
  onSearchChange?: (search: string) => void;
  debounceMs?: number;
  /** 1-based. */
  page?: number;
  pageCount?: number;
  total?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  /** Empty state shown when there are no rows (a different default text while searching). */
  empty?: { icon?: ReactNode; title?: ReactNode; description?: ReactNode; actions?: ReactNode };
  /** Filters and actions next to the search field. */
  toolbar?: ReactNode;
  /** Buttons shown in the toolbar while rows are selected (bulk actions). */
  selectionActions?: ReactNode;
  selectedIds?: string[];
  /** Enables the checkbox column. */
  onSelectionChange?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  density?: "comfortable" | "compact";
  /** Visible caption under the table; also names it for screen readers. */
  caption?: ReactNode;
  "aria-label"?: string;
  labels?: DataTableLabels;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  sort,
  onSortChange,
  search = "",
  onSearchChange,
  debounceMs = 300,
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  loading = false,
  empty,
  toolbar,
  selectionActions,
  selectedIds,
  onSelectionChange,
  onRowClick,
  density = "comfortable",
  caption,
  labels,
  className,
  ...aria
}: DataTableProps<T>) {
  const l = { ...L, ...labels };
  const selectable = Boolean(onSelectionChange);
  const selected = new Set(selectedIds ?? []);
  const pageIds = rows.map(getRowId);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPage = pageIds.some((id) => selected.has(id));
  const span = columns.length + (selectable ? 1 : 0);
  const skeletonRows = Math.min(rows.length || pageSize || 5, 10);

  const toggleAll = () => {
    const next = new Set(selected);
    if (allOnPage) pageIds.forEach((id) => next.delete(id));
    else pageIds.forEach((id) => next.add(id));
    onSelectionChange?.([...next]);
  };
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange?.([...next]);
  };
  const sortBy = (key: string) => {
    if (!onSortChange) return;
    onSortChange(sort?.key === key ? { key, direction: sort.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" });
  };
  const onRowKey = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick?.(row);
    }
  };

  const hasToolbar = Boolean(onSearchChange || toolbar || (selectable && selected.size > 0));
  const showPagination = page !== undefined && pageCount !== undefined && pageCount > 0 && onPageChange;

  return (
    <div className={cn("flex w-full min-w-0 flex-col overflow-hidden rounded-2xl bg-surface shadow-xs", className)}>
      {hasToolbar && (
        <div className="flex flex-wrap items-center gap-2 border-b border-separator p-3">
          {selectable && selected.size > 0 ? (
            <div className="flex min-h-10 flex-1 flex-wrap items-center gap-2">
              <span className="px-1 text-subhead font-semibold text-fg pl-tabular" aria-live="polite">
                {l.selected(selected.size)}
              </span>
              {selectionActions}
            </div>
          ) : (
            <>
              {onSearchChange && (
                <SearchBar
                  defaultValue={search}
                  onValueChange={onSearchChange}
                  debounce={debounceMs}
                  label={l.search}
                  placeholder={l.searchPlaceholder}
                  className="min-w-0 flex-1 basis-56"
                />
              )}
              {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
            </>
          )}
        </div>
      )}

      <Table
        surface={false}
        density={density}
        aria-label={aria["aria-label"]}
        aria-busy={loading || undefined}
        wrapperClassName="min-w-0"
      >
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12 pe-0">
                <Checkbox
                  shape="square"
                  size="sm"
                  aria-label={l.selectAll}
                  checked={allOnPage ? true : someOnPage ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  disabled={loading || rows.length === 0}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={column.key}
                align={column.align}
                style={column.width ? { width: column.width } : undefined}
                className={column.className}
                {...(column.sortable && onSortChange
                  ? { sort: sort?.key === column.key ? sort.direction : (false as const), onSort: () => sortBy(column.key) }
                  : {})}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: skeletonRows }, (_, i) => (
              <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                {selectable && (
                  <TableCell className="w-12 pe-0">
                    <Skeleton className="size-[1.125rem] rounded-[30%]" />
                  </TableCell>
                )}
                {columns.map((column, c) => (
                  <TableCell key={column.key} align={column.align}>
                    <Skeleton shape="text" className={cn("inline-block text-subhead", column.align === "end" && "ms-auto")} width={`${[70, 55, 40, 60, 50][(i + c) % 5]}%`} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent [tbody_&]:hover:bg-transparent">
              <TableCell colSpan={span} className="border-b-0">
                <EmptyState
                  size="sm"
                  icon={empty?.icon}
                  title={empty?.title ?? (search ? l.noResultsTitle : l.emptyTitle)}
                  description={empty?.description ?? (search ? l.noResultsDescription(search) : l.emptyDescription)}
                  actions={empty?.actions}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const id = getRowId(row);
              const isSelected = selected.has(id);
              return (
                <TableRow
                  key={id}
                  data-state={isSelected ? "selected" : undefined}
                  aria-selected={selectable ? isSelected : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (event) => onRowKey(event, row) : undefined}
                  className={cn(onRowClick && "pl-focus-ring cursor-pointer outline-offset-[-2px]")}
                >
                  {selectable && (
                    <TableCell className="w-12 pe-0" onClick={(event) => event.stopPropagation()}>
                      <Checkbox shape="square" size="sm" aria-label={l.selectRow(id)} checked={isSelected} onCheckedChange={() => toggle(id)} />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align} className={cn(column.nowrap && "whitespace-nowrap", column.className)}>
                      {column.cell ? column.cell(row) : String((row as Record<string, unknown>)[column.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {showPagination && (
        <div className="border-t border-separator px-3 py-2.5 sm:px-4">
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={onPageChange}
            total={total}
            pageSize={pageSize}
            size="sm"
            variant="pages"
            className={total !== undefined && pageSize !== undefined ? "w-full" : "justify-end"}
          />
        </div>
      )}
    </div>
  );
}
