import type { ApiErrorBody, FieldError } from "../errors.ts";
import type { CursorPage, Page } from "../list.ts";

/** Removes `readonly` so the mock can update rows in place. */
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** Seeded pseudo random generator (mulberry32), so the seed data is stable. */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    bool: (probability = 0.5) => next() < probability,
    chars: (length: number, alphabet = "abcdefghijklmnopqrstuvwxyz0123456789") =>
      Array.from({ length }, () => alphabet[Math.floor(next() * alphabet.length)]).join(""),
  };
}

export type Random = ReturnType<typeof createRandom>;

/** Error thrown by route handlers, turned into the backend error format. */
export class MockError extends Error {
  readonly status: number;
  readonly code: string;
  readonly extra: Record<string, unknown>;

  constructor(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }

  toBody(): { error: ApiErrorBody } {
    return { error: { status: this.status, code: this.code, message: this.message, ...this.extra } };
  }
}

export const fail = (status: number, code: string, message: string, extra?: Record<string, unknown>) =>
  new MockError(status, code, message, extra);

export const notFound = () => fail(404, "not_found", "Not found.");

/** A 400 validation error with field errors, as DRF + pleate's exception handler answer it. */
export function validation(fields: Record<string, FieldError[] | FieldError>): MockError {
  const out: Record<string, FieldError[]> = {};
  for (const [key, value] of Object.entries(fields)) out[key] = Array.isArray(value) ? value : [value];
  return fail(400, "validation_error", "Some fields are not valid.", { fields: out });
}

/** Collects field errors, then throws them all at once. */
export class Validator {
  private readonly errors: Record<string, FieldError[]> = {};

  constructor(private readonly body: Record<string, unknown>) {}

  add(field: string, code: string, message: string) {
    (this.errors[field] ??= []).push({ code, message });
    return this;
  }

  has(field: string) {
    return !!this.errors[field];
  }

  required(field: string): string | undefined {
    const value = this.body[field];
    if (value === undefined || value === null) {
      this.add(field, "required", "This field is required.");
      return undefined;
    }
    if (typeof value === "string" && !value.trim()) {
      this.add(field, "blank", "This field may not be blank.");
      return undefined;
    }
    return String(value);
  }

  optional(field: string): string | undefined {
    const value = this.body[field];
    return value === undefined || value === null ? undefined : String(value);
  }

  email(field: string, required = true): string | undefined {
    const value = required ? this.required(field) : this.optional(field);
    if (value === undefined || this.has(field)) return value;
    if (!EMAIL.test(value.trim())) {
      this.add(field, "invalid", "Enter a valid email address.");
      return undefined;
    }
    return value.trim().toLowerCase();
  }

  throwIfAny() {
    if (Object.keys(this.errors).length) throw validation(this.errors);
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export const noContent = (status = 204) => new Response(null, { status });

export function errorResponse(error: MockError): Response {
  return json(error.toBody(), error.status);
}

export function iso(date: Date | number): string {
  return new Date(date).toISOString();
}

export function truthy(value: string | null | undefined): boolean | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const v = value.toLowerCase();
  if (["true", "1", "yes", "on"].includes(v)) return true;
  if (["false", "0", "no", "off"].includes(v)) return false;
  return undefined;
}

type Comparable = string | number | boolean | null | undefined;

export interface ListSpec<T> {
  /** Fields matched (case insensitive, substring) by `?search=`. */
  search?: (keyof T & string)[];
  /** Fields accepted by `?ordering=`. */
  ordering?: (keyof T & string)[];
  /** Applied when `?ordering=` is absent. */
  defaultOrdering?: string;
  /** `?<name>=value` filters. Unknown query keys are ignored, like django-filter. */
  filters?: Record<string, (item: T, value: string) => boolean>;
}

function compare(a: Comparable, b: Comparable): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === "string" && typeof b === "string") return a.localeCompare(b, "en", { sensitivity: "base" });
  return a < b ? -1 : 1;
}

/** Search, filters and ordering, shared by page and cursor lists. */
export function query<T>(items: T[], url: URL, spec: ListSpec<T>): T[] {
  let rows = items.slice();
  const search = url.searchParams.get("search")?.trim().toLowerCase();
  if (search && spec.search?.length) {
    const fields = spec.search;
    rows = rows.filter((row) =>
      fields.some((f) => String((row as Record<string, unknown>)[f] ?? "").toLowerCase().includes(search)),
    );
  }
  for (const [name, test] of Object.entries(spec.filters ?? {})) {
    const value = url.searchParams.get(name);
    if (value === null || value === "") continue;
    rows = rows.filter((row) => test(row, value));
  }
  const requested = (url.searchParams.get("ordering") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && spec.ordering?.includes(s.replace(/^-/, "") as keyof T & string));
  const ordering = requested.length ? requested : (spec.defaultOrdering ?? "").split(",").filter(Boolean);
  if (ordering.length) {
    rows.sort((a, b) => {
      for (const key of ordering) {
        const desc = key.startsWith("-");
        const field = key.replace(/^-/, "");
        const result = compare(
          (a as Record<string, Comparable>)[field],
          (b as Record<string, Comparable>)[field],
        );
        if (result) return desc ? -result : result;
      }
      return 0;
    });
  }
  return rows;
}

/** Page mode list: `{results, count, page, page_size, page_count}`. */
export function page<T, R = T>(rows: T[], url: URL, map: (row: T) => R = (r) => r as unknown as R): Page<R> {
  const size = clamp(Number(url.searchParams.get("page_size")) || 20, 1, 100);
  const raw = url.searchParams.get("page");
  const number = raw === null ? 1 : Number(raw);
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  if (!Number.isInteger(number) || number < 1 || number > pageCount) {
    throw fail(404, "invalid_page", "Invalid page.");
  }
  return {
    results: rows.slice((number - 1) * size, number * size).map(map),
    count: rows.length,
    page: number,
    page_size: size,
    page_count: pageCount,
  };
}

/** Cursor mode list over rows already in "newest first" order. */
export function cursor<T, R = T>(
  rows: T[],
  url: URL,
  map: (row: T) => R = (r) => r as unknown as R,
  defaultSize = 20,
): CursorPage<R> {
  const size = clamp(Number(url.searchParams.get("page_size")) || defaultSize, 1, 100);
  const offset = decodeCursor(url.searchParams.get("cursor"));
  const slice = rows.slice(offset, offset + size);
  return {
    results: slice.map(map),
    next_cursor: offset + size < rows.length ? encodeCursor(offset + size) : null,
    previous_cursor: offset > 0 ? encodeCursor(Math.max(0, offset - size)) : null,
  };
}

function encodeCursor(offset: number): string {
  return btoa(`o=${offset}`).replace(/=+$/, "");
}

function decodeCursor(value: string | null): number {
  if (!value) return 0;
  try {
    const decoded = atob(value + "=".repeat((4 - (value.length % 4)) % 4));
    const offset = Number(decoded.replace(/^o=/, ""));
    if (Number.isInteger(offset) && offset >= 0) return offset;
  } catch {
    // falls through
  }
  throw fail(404, "not_found", "Invalid cursor");
}

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Copy of an internal row without its `_` prefixed bookkeeping fields. */
export function pub<T extends object>(row: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) if (!key.startsWith("_")) out[key] = value;
  return out as T;
}

export const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (ms <= 0 || signal?.aborted) return resolve();
    const id = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(id);
      resolve();
    });
  });
