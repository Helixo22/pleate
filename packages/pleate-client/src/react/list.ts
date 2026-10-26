"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CursorPage, CursorParams, ListParams, Page, Sort } from "../list.ts";
import { fromOrdering, toOrdering } from "../list.ts";
import { keys, usePleateClient } from "./provider.tsx";

type Filters = Record<string, string | number | boolean | undefined | null>;

export type UseListOptions = {
  pageSize?: number;
  /** Initial ordering, e.g. "-created_at". */
  ordering?: string;
  filters?: Filters;
  /** Keep page, search, ordering and filters in the address bar (?page=2&search=...). */
  syncUrl?: boolean;
  /** Debounce for searchProps (SearchBar). DataTable debounces on its own. */
  searchDebounceMs?: number;
  enabled?: boolean;
};

function readUrl(): ListParams {
  if (typeof window === "undefined") return {};
  const out: ListParams = {};
  new URLSearchParams(window.location.search).forEach((value, key) => {
    out[key] = key === "page" || key === "page_size" ? Number(value) : value;
  });
  return out;
}

/**
 * State and data for any pleate-backend list endpoint. Spread the prop
 * helpers on the components:
 *
 *     const list = useList<Product>("/catalog/products", { pageSize: 20 });
 *     <DataTable columns={columns} getRowId={(r) => r.id} {...list.tableProps} />
 *     // or <Table/> + <SearchBar {...list.searchProps}/> + <Pagination {...list.paginationProps}/>
 */
export function useList<T>(
  source: string | ((params: ListParams) => Promise<Page<T>>),
  options: UseListOptions = {},
) {
  const client = usePleateClient();
  const initialUrl = useRef(options.syncUrl ? readUrl() : {});
  const init = initialUrl.current;
  const [page, setPageState] = useState<number>(Number(init.page) || 1);
  const [pageSize, setPageSize] = useState<number>(Number(init.page_size) || options.pageSize || 20);
  const [search, setSearchState] = useState<string>(String(init.search ?? ""));
  const [searchInput, setSearchInput] = useState<string>(search);
  const [ordering, setOrdering] = useState<string | undefined>((init.ordering as string) ?? options.ordering);
  const [filters, setFilters] = useState<Filters>(() => {
    const fromUrl: Filters = {};
    for (const [k, v] of Object.entries(init)) {
      if (!["page", "page_size", "search", "ordering"].includes(k)) fromUrl[k] = v as string;
    }
    return { ...options.filters, ...fromUrl };
  });

  const params: ListParams = useMemo(
    () => ({ page, page_size: pageSize, search: search || undefined, ordering, ...filters }),
    [page, pageSize, search, ordering, filters],
  );
  const path = typeof source === "string" ? source : "fn";
  const sourceRef = useRef(source);
  sourceRef.current = source;

  const query = useQuery({
    queryKey: [...keys.list(path), params],
    queryFn: () => {
      const src = sourceRef.current;
      return typeof src === "string" ? client.list<T>(src, params) : src(params);
    },
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });

  useEffect(() => {
    if (!options.syncUrl || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    for (const key of Array.from(url.searchParams.keys())) url.searchParams.delete(key);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      if (key === "page" && value === 1) continue;
      if (key === "page_size" && value === (options.pageSize || 20)) continue;
      url.searchParams.set(key, String(value));
    }
    window.history.replaceState(window.history.state, "", url);
  }, [params, options.syncUrl, options.pageSize]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setSearchInput(value);
    setPageState(1);
  }, []);

  useEffect(() => {
    if (searchInput === search) return;
    const id = setTimeout(() => {
      setSearchState(searchInput);
      setPageState(1);
    }, options.searchDebounceMs ?? 300);
    return () => clearTimeout(id);
  }, [searchInput, search, options.searchDebounceMs]);

  const setSort = useCallback((sort: Sort | null) => {
    setOrdering(toOrdering(sort));
    setPageState(1);
  }, []);

  const setFilter = useCallback((key: string, value: string | number | boolean | undefined | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPageState(1);
  }, []);

  const data = query.data;
  const rows = data?.results ?? [];
  const sort = fromOrdering(ordering);
  const pageCount = data?.page_count ?? 1;
  const total = data?.count ?? 0;

  return {
    ...query,
    rows,
    total,
    page,
    pageCount,
    pageSize,
    search,
    sort,
    filters,
    params,
    setPage: setPageState,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPageState(1);
    },
    setSearch,
    setSort,
    setFilter,
    /** For <DataTable>. */
    tableProps: {
      rows,
      loading: query.isPending || (query.isFetching && query.isPlaceholderData),
      sort,
      onSortChange: setSort,
      search,
      onSearchChange: setSearch,
      page,
      pageCount,
      total,
      pageSize,
      onPageChange: setPageState,
    },
    /** For <Pagination>. */
    paginationProps: { page, pageCount, total, pageSize, onPageChange: setPageState },
    /** For <SearchBar> (debounced). */
    searchProps: {
      value: searchInput,
      onValueChange: setSearchInput,
      onSearch: setSearch,
      loading: query.isFetching && searchInput !== "",
    },
    /** For a <TableHead> column: `<TableHead {...list.sortProps("name")}>`. */
    sortProps: (key: string) => ({
      sort: sort?.key === key ? sort.direction : (false as const),
      onSort: () =>
        setSort(
          sort?.key !== key
            ? { key, direction: "asc" }
            : sort.direction === "asc"
              ? { key, direction: "desc" }
              : null,
        ),
    }),
  };
}

/** Cursor lists (feeds): `const feed = useCursorList(...)`, then `feed.fetchNextPage()`. */
export function useCursorList<T>(
  queryKey: readonly unknown[],
  fetcher: (params: CursorParams) => Promise<CursorPage<T>>,
  options: { pageSize?: number; params?: CursorParams; enabled?: boolean } = {},
) {
  const query = useInfiniteQuery({
    queryKey: [...queryKey, options.params ?? {}],
    queryFn: ({ pageParam }) =>
      fetcher({ ...options.params, cursor: pageParam ?? undefined, page_size: options.pageSize }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor,
    enabled: options.enabled ?? true,
  });
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.results) ?? [], [query.data]);
  return { ...query, items };
}
