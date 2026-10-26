"use client";

import { type InfiniteData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import type { Notification } from "../api.ts";
import type { CursorPage } from "../list.ts";
import { useCursorList } from "./list.ts";
import { keys, usePleateClient } from "./provider.tsx";

/**
 * The notification inbox with live updates (Server-Sent Events). Spread
 * `notificationCenterProps` on <NotificationBell> or <NotificationCenter>.
 */
export function useNotifications(options: { live?: boolean; pageSize?: number; unreadOnly?: boolean } = {}) {
  const client = usePleateClient();
  const qc = useQueryClient();
  const live = options.live ?? true;
  const feed = useCursorList<Notification>(keys.notifications, (p) => client.notifications.list(p), {
    pageSize: options.pageSize ?? 20,
    params: options.unreadOnly ? { unread: true } : undefined,
  });
  const unread = useQuery({ queryKey: keys.unread, queryFn: client.notifications.unreadCount });

  useEffect(() => {
    if (!live) return;
    const controller = new AbortController();
    let retry: ReturnType<typeof setTimeout> | undefined;
    const connect = async (delay: number) => {
      try {
        for await (const event of client.notifications.stream(controller.signal)) {
          delay = 1000;
          if (event.event === "unread_count") {
            qc.setQueryData(keys.unread, event.data as { count: number });
          } else if (event.event === "notification") {
            const item = event.data as Notification;
            qc.setQueriesData<InfiniteData<CursorPage<Notification>>>({ queryKey: keys.notifications }, (data) => {
              // keys.notifications also prefixes the unread count query ({count}): skip non feed data.
              if (!data?.pages?.length) return data;
              const [first, ...rest] = data.pages;
              if (first.results.some((n) => n.id === item.id)) return data;
              return { ...data, pages: [{ ...first, results: [item, ...first.results] }, ...rest] };
            });
          }
        }
      } catch {
        // dropped connection: retry below
      }
      if (!controller.signal.aborted) retry = setTimeout(() => connect(Math.min(delay * 2, 30_000)), delay);
    };
    void connect(1000);
    return () => {
      controller.abort();
      if (retry) clearTimeout(retry);
    };
  }, [client, qc, live]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: keys.notifications });
  };
  const markRead = useMutation({ mutationFn: client.notifications.markRead, onSuccess: refresh });
  const markAllRead = useMutation({ mutationFn: client.notifications.markAllRead, onSuccess: refresh });
  const remove = useMutation({ mutationFn: client.notifications.remove, onSuccess: refresh });

  const unreadCount = unread.data?.count ?? 0;
  return {
    ...feed,
    unreadCount,
    markRead,
    markAllRead,
    remove,
    notificationCenterProps: {
      items: feed.items.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body || undefined,
        createdAt: n.created_at,
        read: n.read,
        href: n.url || undefined,
        kind: n.kind,
      })),
      unreadCount,
      loading: feed.isPending,
      hasMore: feed.hasNextPage,
      onLoadMore: () => void feed.fetchNextPage(),
      onMarkRead: (id: string) => markRead.mutate(id),
      onMarkAllRead: () => markAllRead.mutate(),
      onDelete: (id: string) => remove.mutate(id),
    },
  };
}

/** Browser push: asks permission, subscribes with the backend VAPID key. */
export function usePushSubscription() {
  const client = usePleateClient();
  return useMutation({
    mutationFn: async (registration: ServiceWorkerRegistration) => {
      const { key } = await client.notifications.pushPublicKey();
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notifications are blocked in this browser.");
      const raw = atob(key.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(key.length / 4) * 4, "="));
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: Uint8Array.from(raw, (c) => c.charCodeAt(0)),
      });
      await client.notifications.subscribePush(sub.toJSON());
      return sub;
    },
  });
}
