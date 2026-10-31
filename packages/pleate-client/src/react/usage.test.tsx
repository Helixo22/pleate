import { act, renderHook, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestBackend } from "../test/backend.ts";
import { wrapper } from "../test/wrapper.tsx";
import { usePreferences } from "./auth.ts";
import { useSearch } from "./search.ts";
import { usageMeterProps, useUsage } from "./usage.ts";

const { db, server } = createTestBackend();
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
beforeEach(() => db.reset());
afterAll(() => server.close());

describe("useUsage", () => {
  it("maps items with a limit onto UsageMeter props", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useUsage(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.usageMeterProps).toHaveLength(4));
    expect(result.current.usageMeterProps[0]).toMatchObject({ label: "Storage", max: 500, unit: "MB" });
  });

  it("shows large byte quotas in GB", () => {
    const props = usageMeterProps({ id: "storage", label: "Storage", used: 1024 ** 3, limit: 10 * 1024 ** 3, unit: "bytes" });
    expect(props).toEqual({ label: "Storage", segments: [{ label: "Storage", value: 1 }], max: 10, unit: "GB" });
  });
});

describe("usePreferences", () => {
  it("updates optimistically and keeps the server answer", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => usePreferences(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.preferences?.theme).toBe("system"));
    act(() => result.current.update.mutate({ theme: "dark" }));
    await waitFor(() => expect(result.current.preferences?.theme).toBe("dark"));
    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
  });

  it("rolls back when the server refuses", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => usePreferences(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.preferences).toBeDefined());
    act(() => result.current.update.mutate({ palette: "hotpink" }));
    await waitFor(() => expect(result.current.update.isError).toBe(true));
    expect(result.current.preferences?.palette).toBeNull();
  });
});

describe("useSearch", () => {
  it("waits for 2 characters, then searches", async () => {
    const { Wrapper } = wrapper();
    const { result, rerender } = renderHook(({ q }) => useSearch(q), { wrapper: Wrapper, initialProps: { q: "s" } });
    expect(result.current.fetchStatus).toBe("idle");
    rerender({ q: "spring" });
    await waitFor(() => expect(result.current.results.length).toBeGreaterThan(0));
  });
});
