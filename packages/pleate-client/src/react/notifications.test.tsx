import { act, renderHook, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createMockHandlers } from "../mock/index.ts";
import { BASE, createTestBackend } from "../test/backend.ts";
import { wrapper } from "../test/wrapper.tsx";
import { useNotifications } from "./notifications.ts";

const { db, server } = createTestBackend();
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
beforeEach(() => db.reset());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("useNotifications", () => {
  it("loads the first page and the unread count, shaped for <NotificationCenter>", async () => {
    const { Wrapper } = wrapper();
    const { result, unmount } = renderHook(() => useNotifications({ live: false }), { wrapper: Wrapper });
    expect(result.current.notificationCenterProps.loading).toBe(true);
    await waitFor(() => expect(result.current.notificationCenterProps.items).toHaveLength(20));
    await waitFor(() => expect(result.current.unreadCount).toBe(11));
    const props = result.current.notificationCenterProps;
    expect(props).toMatchObject({ unreadCount: 11, loading: false, hasMore: true });
    const first = props.items[0];
    expect(Object.keys(first).sort()).toEqual(["body", "createdAt", "href", "id", "kind", "read", "title"]);
    expect(first.read).toBe(false);
    const maintenance = props.items.find((n) => n.kind === "system.maintenance");
    if (maintenance) expect(maintenance.href).toBeUndefined();
    act(() => props.onLoadMore());
    await waitFor(() => expect(result.current.notificationCenterProps.items).toHaveLength(34));
    expect(result.current.notificationCenterProps.hasMore).toBe(false);
    unmount();
  });

  it("marks one and all as read, and deletes", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useNotifications({ live: false }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.unreadCount).toBe(11));
    const target = result.current.notificationCenterProps.items[0];
    act(() => result.current.notificationCenterProps.onMarkRead(target.id));
    await waitFor(() => expect(result.current.unreadCount).toBe(10));
    await waitFor(() =>
      expect(result.current.notificationCenterProps.items.find((n) => n.id === target.id)?.read).toBe(true),
    );
    act(() => result.current.notificationCenterProps.onDelete(target.id));
    await waitFor(() => expect(result.current.notificationCenterProps.items.some((n) => n.id === target.id)).toBe(false));
    act(() => result.current.notificationCenterProps.onMarkAllRead());
    await waitFor(() => expect(result.current.unreadCount).toBe(0));
    expect(result.current.notificationCenterProps.items.every((n) => n.read)).toBe(true);
  });

  it("filters unread only", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useNotifications({ live: false, unreadOnly: true, pageSize: 50 }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.notificationCenterProps.items).toHaveLength(11));
    expect(result.current.notificationCenterProps.items.every((n) => !n.read)).toBe(true);
  });

  it("inserts live notifications from the stream and follows the unread count", async () => {
    server.resetHandlers(
      ...createMockHandlers({ db, baseUrl: BASE, latency: 0, streamDelay: 0, liveNotificationInterval: 60 }),
    );
    const { Wrapper } = wrapper();
    const { result, unmount } = renderHook(() => useNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.notificationCenterProps.items).toHaveLength(20));
    const before = result.current.notificationCenterProps.items[0].id;
    await waitFor(() => expect(result.current.notificationCenterProps.items[0].id).not.toBe(before), { timeout: 2000 });
    const live = result.current.notificationCenterProps.items[0];
    expect(live).toMatchObject({ title: "New order #1043", kind: "order.created", read: false, href: "/orders/1043" });
    await waitFor(() => expect(result.current.unreadCount).toBeGreaterThanOrEqual(12));
    expect(result.current.notificationCenterProps.items.filter((n) => n.id === live.id)).toHaveLength(1);

    // Changes made elsewhere arrive as unread_count events.
    const ada = db.users[0];
    const unreadIds = db.notifications.filter((n) => n._owner === ada.id && !n.read).map((n) => n.id);
    for (const n of db.notifications) if (unreadIds.includes(n.id)) n.read = true;
    db.publish(ada.id, { event: "unread_count", data: { count: 0 } });
    await waitFor(() => expect(result.current.unreadCount).toBeLessThanOrEqual(1));
    unmount();
  });
});
