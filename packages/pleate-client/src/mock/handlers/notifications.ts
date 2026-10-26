import type { MockNotification } from "../db.ts";
import type { Ctx, Router } from "../router.ts";
import { LIVE_NOTIFICATIONS } from "../seed.ts";
import { type MockSseEvent, sseResponse } from "../sse.ts";
import { cursor, json, noContent, notFound, pub, query, truthy, validation } from "../util.ts";

const CHANNELS = ["in_app", "email", "push"];

function own(ctx: Ctx): MockNotification {
  const item = ctx.db.notifications.find((n) => n._owner === ctx.user.id && n.id === ctx.params.id);
  if (!item) throw notFound();
  return item;
}

function publishCount(ctx: Ctx) {
  ctx.db.publish(ctx.user.id, { event: "unread_count", data: { count: ctx.db.unreadCount(ctx.user.id) } });
}

function preferences(ctx: Ctx) {
  return { channels: ctx.db.notificationPrefs[ctx.user.id] ?? { "*": ["in_app"] }, available_channels: CHANNELS };
}

export function notificationRoutes(r: Router) {
  r.get("/notifications", (ctx) => {
    const rows = query(
      ctx.db.notifications.filter((n) => n._owner === ctx.user.id),
      ctx.url,
      {
        defaultOrdering: "-created_at",
        filters: {
          unread: (n, v) => {
            const flag = truthy(v);
            return flag === undefined ? true : flag ? !n.read : n.read;
          },
          kind: (n, v) => n.kind === v,
        },
      },
    );
    return json(cursor(rows, ctx.url, pub));
  });
  r.delete("/notifications", (ctx) => {
    const before = ctx.db.notifications.length;
    ctx.db.notifications = ctx.db.notifications.filter((n) => n._owner !== ctx.user.id || !n.read);
    return json({ count: before - ctx.db.notifications.length });
  });
  r.get("/notifications/unread-count", (ctx) => json({ count: ctx.db.unreadCount(ctx.user.id) }));
  r.post("/notifications/read-all", (ctx) => {
    let count = 0;
    const now = new Date().toISOString();
    for (const n of ctx.db.notifications) {
      if (n._owner === ctx.user.id && !n.read) {
        n.read = true;
        n.read_at = now;
        count += 1;
      }
    }
    if (count) publishCount(ctx);
    return json({ count });
  });
  r.get("/notifications/preferences", (ctx) => json(preferences(ctx)));
  r.put("/notifications/preferences", async (ctx) => {
    const data = await ctx.body<{ channels?: unknown }>();
    const channels = data.channels;
    if (!channels || typeof channels !== "object" || Array.isArray(channels)) {
      throw validation({ channels: { code: "required", message: "This field is required." } });
    }
    for (const list of Object.values(channels as Record<string, unknown>)) {
      const bad = (Array.isArray(list) ? list : [list]).find((c) => !CHANNELS.includes(String(c)));
      if (bad !== undefined) {
        throw validation({ channels: { code: "invalid_channel", message: `Unknown channel: ${String(bad)}.` } });
      }
    }
    ctx.db.notificationPrefs[ctx.user.id] = channels as Record<string, string[]>;
    return json(preferences(ctx));
  });
  r.get("/notifications/push/public-key", () => json({ key: null }));
  r.post("/notifications/push/subscriptions", async (ctx) => {
    const data = await ctx.body<{ endpoint?: string; keys?: { p256dh?: string; auth?: string } }>();
    if (!data.endpoint) throw validation({ endpoint: { code: "required", message: "This field is required." } });
    if (!data.keys?.p256dh || !data.keys.auth) throw validation({ keys: { code: "required", message: "This field is required." } });
    const created_at = new Date().toISOString();
    ctx.db.pushSubscriptions = ctx.db.pushSubscriptions.filter((s) => s.endpoint !== data.endpoint);
    ctx.db.pushSubscriptions.push({ endpoint: data.endpoint, owner: ctx.user.id, created_at });
    return json({ endpoint: data.endpoint, created_at }, 201);
  });
  r.delete("/notifications/push/subscriptions", async (ctx) => {
    const data = await ctx.body<{ endpoint?: string }>();
    const found = ctx.db.pushSubscriptions.find((s) => s.endpoint === data.endpoint && s.owner === ctx.user.id);
    if (!found) throw notFound();
    ctx.db.pushSubscriptions = ctx.db.pushSubscriptions.filter((s) => s !== found);
    return noContent();
  });

  r.get("/notifications/stream", (ctx) => {
    const { db, user, options } = ctx;
    return sseResponse(async function* (signal) {
      const queue: MockSseEvent[] = [];
      let wake: (() => void) | null = null;
      const push = (event: MockSseEvent) => {
        queue.push(event);
        wake?.();
      };
      const unsubscribe = db.subscribe((userId, event) => {
        if (userId === user.id) push(event);
      });
      let live = 0;
      const timer =
        options.liveNotificationInterval > 0
          ? setInterval(() => {
              const t = LIVE_NOTIFICATIONS[live++ % LIVE_NOTIFICATIONS.length];
              const item: MockNotification = {
                id: db.id(),
                ...t,
                data: {},
                read: false,
                read_at: null,
                created_at: new Date().toISOString(),
                _owner: user.id,
              };
              db.notifications.unshift(item);
              db.publish(user.id, { event: "notification", data: pub(item) });
              db.publish(user.id, { event: "unread_count", data: { count: db.unreadCount(user.id) } });
            }, options.liveNotificationInterval)
          : undefined;
      const heartbeat = setInterval(() => push({ event: "", data: undefined }), 25_000);
      signal.addEventListener("abort", () => wake?.());
      try {
        yield "retry: 3000\n\n";
        yield { event: "unread_count", data: { count: db.unreadCount(user.id) } };
        while (!signal.aborted) {
          if (!queue.length) {
            await new Promise<void>((resolve) => {
              wake = resolve;
            });
            wake = null;
            continue;
          }
          const next = queue.shift()!;
          yield next.event ? next : null;
        }
      } finally {
        unsubscribe();
        if (timer) clearInterval(timer);
        clearInterval(heartbeat);
      }
    }, ctx.request.signal);
  });

  r.post("/notifications/:id/read", (ctx) => {
    const item = own(ctx);
    if (!item.read) {
      item.read = true;
      item.read_at = new Date().toISOString();
      publishCount(ctx);
    }
    return json(pub(item));
  });
  r.post("/notifications/:id/unread", (ctx) => {
    const item = own(ctx);
    if (item.read) {
      item.read = false;
      item.read_at = null;
      publishCount(ctx);
    }
    return json(pub(item));
  });
  r.delete("/notifications/:id", (ctx) => {
    const item = own(ctx);
    ctx.db.notifications = ctx.db.notifications.filter((n) => n !== item);
    if (!item.read) publishCount(ctx);
    return noContent();
  });
}
