/**
 * Query params understood by every pleate-backend list endpoint.
 * Extra keys are sent as field filters (`?status=open`).
 */
export interface ListParams {
  page?: number;
  page_size?: number;
  /** Full text search over the endpoint's search fields. */
  search?: string;
  /** Comma separated fields, `-` for descending: `-created_at,name`. */
  ordering?: string;
  [filter: string]: string | number | boolean | undefined | null;
}

export interface CursorParams {
  cursor?: string | null;
  page_size?: number;
  [filter: string]: string | number | boolean | undefined | null;
}

/** Response of page mode lists, ready for Table + Pagination. */
export interface Page<T> {
  results: T[];
  count: number;
  page: number;
  page_size: number;
  page_count: number;
}

/** Response of cursor mode lists (feeds, chat, notifications). */
export interface CursorPage<T> {
  results: T[];
  next_cursor: string | null;
  previous_cursor: string | null;
}

export type SortDirection = "asc" | "desc";

export interface Sort {
  key: string;
  direction: SortDirection;
}

export function toOrdering(sort: Sort | null | undefined): string | undefined {
  if (!sort) return undefined;
  return sort.direction === "desc" ? `-${sort.key}` : sort.key;
}

export function fromOrdering(ordering: string | null | undefined): Sort | null {
  const first = ordering?.split(",")[0]?.trim();
  if (!first) return null;
  return first.startsWith("-") ? { key: first.slice(1), direction: "desc" } : { key: first, direction: "asc" };
}

export function toSearchParams(params: Record<string, unknown> | undefined): URLSearchParams {
  const qs = new URLSearchParams();
  if (!params) return qs;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, String(v)));
    else qs.set(key, String(value));
  }
  return qs;
}
