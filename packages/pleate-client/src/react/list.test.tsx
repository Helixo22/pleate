import { act, renderHook, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { MockProduct } from "../mock/index.ts";
import { createTestBackend } from "../test/backend.ts";
import { wrapper } from "../test/wrapper.tsx";
import { useList } from "./list.ts";

const { server } = createTestBackend();
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterAll(() => server.close());

function setup(options: Parameters<typeof useList>[1] = {}) {
  const { Wrapper } = wrapper();
  return renderHook(() => useList<MockProduct>("/catalog/products", { searchDebounceMs: 40, ...options }), {
    wrapper: Wrapper,
  });
}

describe("useList", () => {
  it("loads the first page and exposes table, pagination and sort props", async () => {
    const { result } = setup();
    expect(result.current.tableProps.loading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const list = result.current;
    expect(list.rows).toHaveLength(20);
    expect(list).toMatchObject({ total: 120, page: 1, pageCount: 6, pageSize: 20, search: "", sort: null });
    expect(list.params).toEqual({ page: 1, page_size: 20, search: undefined, ordering: undefined });
    expect(Object.keys(list.tableProps).sort()).toEqual(
      ["loading", "onPageChange", "onSearchChange", "onSortChange", "page", "pageCount", "pageSize", "rows", "search", "sort", "total"].sort(),
    );
    expect(list.tableProps).toMatchObject({ rows: list.rows, loading: false, page: 1, pageCount: 6, total: 120, pageSize: 20, sort: null, search: "" });
    expect(list.paginationProps).toEqual({ page: 1, pageCount: 6, total: 120, pageSize: 20, onPageChange: expect.any(Function) });
    expect(list.searchProps).toEqual({ value: "", onValueChange: expect.any(Function), onSearch: expect.any(Function), loading: false });
    expect(list.sortProps("price")).toEqual({ sort: false, onSort: expect.any(Function) });
  });

  it("changes page through paginationProps and keeps the previous rows while loading", async () => {
    const { result } = setup({ pageSize: 50 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const firstIds = result.current.rows.map((r) => r.id);
    act(() => result.current.paginationProps.onPageChange(3));
    expect(result.current.page).toBe(3);
    expect(result.current.rows.map((r) => r.id)).toEqual(firstIds);
    await waitFor(() => expect(result.current.rows).toHaveLength(20));
    expect(result.current.rows.some((r) => firstIds.includes(r.id))).toBe(false);
    act(() => result.current.setPageSize(10));
    expect(result.current.page).toBe(1);
    await waitFor(() => expect(result.current.pageCount).toBe(12));
  });

  it("debounces searchProps and resets the page", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    act(() => result.current.setPage(2));
    act(() => result.current.searchProps.onValueChange("plate"));
    expect(result.current.searchProps.value).toBe("plate");
    expect(result.current.search).toBe("");
    expect(result.current.page).toBe(2);
    await waitFor(() => expect(result.current.search).toBe("plate"));
    expect(result.current.page).toBe(1);
    await waitFor(() => expect(result.current.total).toBeLessThan(120));
    expect(result.current.rows.every((r) => /plate/i.test(`${r.name} ${r.sku} ${r.category}`))).toBe(true);
    // DataTable's own (already debounced) search applies at once.
    act(() => result.current.tableProps.onSearchChange(""));
    expect(result.current.search).toBe("");
    await waitFor(() => expect(result.current.total).toBe(120));
  });

  it("cycles sorting asc, desc, none through sortProps", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    act(() => result.current.sortProps("price").onSort());
    expect(result.current.sort).toEqual({ key: "price", direction: "asc" });
    expect(result.current.sortProps("price").sort).toBe("asc");
    expect(result.current.sortProps("name").sort).toBe(false);
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
    const asc = result.current.rows.map((r) => r.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    act(() => result.current.sortProps("price").onSort());
    expect(result.current.params.ordering).toBe("-price");
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
    const desc = result.current.rows.map((r) => r.price);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    act(() => result.current.sortProps("price").onSort());
    expect(result.current.sort).toBeNull();
    act(() => result.current.tableProps.onSortChange({ key: "stock", direction: "desc" }));
    expect(result.current.params.ordering).toBe("-stock");
  });

  it("applies filters and initial options", async () => {
    const { result } = setup({ pageSize: 100, ordering: "name", filters: { status: "draft" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.sort).toEqual({ key: "name", direction: "asc" });
    expect(result.current.rows.length).toBeGreaterThan(0);
    expect(result.current.rows.every((r) => r.status === "draft")).toBe(true);
    act(() => result.current.setFilter("low_stock", true));
    expect(result.current.filters).toEqual({ status: "draft", low_stock: true });
    await waitFor(() => expect(result.current.params.low_stock).toBe(true));
    await waitFor(() => expect(result.current.rows.every((r) => r.stock < 10 && r.status === "draft")).toBe(true));
    act(() => result.current.setFilter("status", undefined));
    act(() => result.current.setFilter("low_stock", undefined));
    await waitFor(() => expect(result.current.total).toBe(120));
  });

  it("accepts a fetcher function instead of a path", async () => {
    const { Wrapper } = wrapper();
    const calls: unknown[] = [];
    const { result } = renderHook(
      () =>
        useList<{ id: number }>(async (params) => {
          calls.push(params);
          return { results: [{ id: 1 }], count: 1, page: 1, page_size: 20, page_count: 1 };
        }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.rows).toEqual([{ id: 1 }]));
    expect(calls[0]).toMatchObject({ page: 1, page_size: 20 });
  });
});
