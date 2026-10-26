import { describe, expect, it } from "vitest";

import { fromOrdering, toOrdering, toSearchParams } from "./list.ts";

describe("list helpers", () => {
  it("converts a sort to an ordering and back", () => {
    expect(toOrdering({ key: "price", direction: "asc" })).toBe("price");
    expect(toOrdering({ key: "price", direction: "desc" })).toBe("-price");
    expect(toOrdering(null)).toBeUndefined();
    expect(toOrdering(undefined)).toBeUndefined();
    expect(fromOrdering("-created_at")).toEqual({ key: "created_at", direction: "desc" });
    expect(fromOrdering("name")).toEqual({ key: "name", direction: "asc" });
    expect(fromOrdering(" -stock , name")).toEqual({ key: "stock", direction: "desc" });
    expect(fromOrdering("")).toBeNull();
    expect(fromOrdering(undefined)).toBeNull();
  });

  it("builds query strings, skipping empty values and repeating arrays", () => {
    const qs = toSearchParams({ page: 2, search: "", ordering: undefined, status: null, low_stock: true, tag: ["a", "b"], q: "x y" });
    expect(qs.toString()).toBe("page=2&low_stock=true&tag=a&tag=b&q=x+y");
    expect(toSearchParams(undefined).toString()).toBe("");
    expect(toSearchParams({ zero: 0, no: false }).toString()).toBe("zero=0&no=false");
  });
});
