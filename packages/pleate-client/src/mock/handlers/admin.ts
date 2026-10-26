import type { Schema } from "../../api.ts";
import type { MockDelivery, MockEndpoint, MockUser } from "../db.ts";
import type { Ctx, Router } from "../router.ts";
import { cursor, fail, json, noContent, notFound, page, pub, query, truthy, validation, Validator } from "../util.ts";

const masked = (secret: string) => `whsec_${"*".repeat(8)}${secret.slice(-4)}`;

function endpointOut(e: MockEndpoint): Schema<"Endpoint"> {
  return { ...pub(e), secret: masked(e._secret) };
}

function ownEndpoint(ctx: Ctx): MockEndpoint {
  const e = ctx.db.endpoints.find((x) => x._owner === ctx.user.id && x.id === ctx.params.id);
  if (!e) throw notFound();
  return e;
}

function deliveryOut(d: MockDelivery): Schema<"Delivery"> {
  const { payload: _p, response_excerpt: _r, ...rest } = pub(d);
  return rest;
}

function validateEndpoint(ctx: Ctx, data: Record<string, unknown>, partial: boolean) {
  const v = new Validator(data);
  if (!partial || data.url !== undefined) {
    const url = v.required("url");
    if (url && !/^https:\/\/[^/\s]+/.test(url)) {
      throw fail(400, "url_not_allowed", "Use a public https URL.");
    }
    if (url && /^https:\/\/(localhost|127\.|10\.|192\.168\.)/.test(url)) {
      throw fail(400, "url_not_allowed", "Use a public https URL.");
    }
  }
  v.throwIfAny();
  if (data.events !== undefined || !partial) {
    const events = Array.isArray(data.events) ? data.events.map(String) : ["*"];
    if (!events.length) throw fail(400, "events_required", "Choose at least one event.");
    const known = new Set(ctx.db.webhookEvents.map((e) => e.name));
    const unknown = events.find((e) => e !== "*" && !known.has(e));
    if (unknown) throw fail(400, "unknown_event", `Unknown event: ${unknown}.`);
    return events;
  }
  return undefined;
}

function staffDetail(ctx: Ctx, user: MockUser): Schema<"StaffUserDetail"> {
  return {
    ...ctx.db.staffUser(user),
    has_password: user.password !== null,
    locale: user.locale,
    timezone: user.timezone,
    sessions_count: ctx.db.sessions.filter((s) => s._owner === user.id).length,
    mfa_enabled: user.mfa.enabled,
  };
}

function staffTarget(ctx: Ctx): MockUser {
  const user = ctx.db.user(ctx.params.id);
  if (!user) throw notFound();
  return user;
}

export function adminRoutes(r: Router) {
  // Activity
  const activityFilters = {
    action: (a: { action: string }, v: string) => a.action === v,
    action__startswith: (a: { action: string }, v: string) => a.action.startsWith(v),
  };
  r.get("/activity", (ctx) => {
    const rows = query(
      ctx.db.activity.filter((a) => a.actor === ctx.user.id),
      ctx.url,
      { defaultOrdering: "-created_at", filters: activityFilters },
    );
    return json(cursor(rows, ctx.url));
  });
  r.get(
    "/activity/all",
    (ctx) => {
      const rows = query(ctx.db.activity, ctx.url, {
        search: ["actor_email", "target_repr", "action"],
        ordering: ["created_at"],
        defaultOrdering: "-created_at",
        filters: {
          ...activityFilters,
          actor: (a, v) => a.actor === v,
          target_type: (a, v) => a.target_type === v,
          target_id: (a, v) => a.target_id === v,
          created_after: (a, v) => a.created_at >= new Date(v).toISOString(),
          created_before: (a, v) => a.created_at <= new Date(v).toISOString(),
        },
      });
      return json(page(rows, ctx.url));
    },
    "staff",
  );
  r.get(
    "/activity/all/:id",
    (ctx) => {
      const entry = ctx.db.activity.find((a) => a.id === ctx.params.id);
      if (!entry) throw notFound();
      return json(entry);
    },
    "staff",
  );

  // Webhooks
  r.get("/webhooks/events", ({ db }) => json(db.webhookEvents));
  r.get("/webhooks/endpoints", (ctx) => {
    const rows = query(ctx.db.endpoints.filter((e) => e._owner === ctx.user.id), ctx.url, {
      ordering: ["created_at"],
      defaultOrdering: "-created_at",
    });
    return json(page(rows, ctx.url, endpointOut));
  });
  r.post("/webhooks/endpoints", async (ctx) => {
    const data = await ctx.body();
    const events = validateEndpoint(ctx, data, false)!;
    if (ctx.db.endpoints.filter((e) => e._owner === ctx.user.id).length >= 20) {
      throw fail(400, "endpoint_limit", "You can have up to 20 endpoints.");
    }
    const secret = `whsec_${ctx.db.random.chars(43, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_")}`;
    const endpoint: MockEndpoint = {
      id: ctx.db.id(),
      url: String(data.url),
      description: String(data.description ?? ""),
      events,
      active: data.active === undefined ? true : !!data.active,
      consecutive_failures: 0,
      disabled_at: null,
      created_at: new Date().toISOString(),
      _owner: ctx.user.id,
      _secret: secret,
    };
    ctx.db.endpoints.unshift(endpoint);
    return json({ ...pub(endpoint), secret }, 201);
  });
  r.get("/webhooks/endpoints/:id", (ctx) => json(endpointOut(ownEndpoint(ctx))));
  r.patch("/webhooks/endpoints/:id", async (ctx) => {
    const endpoint = ownEndpoint(ctx);
    const data = await ctx.body();
    const events = validateEndpoint(ctx, data, true);
    if (data.url !== undefined) endpoint.url = String(data.url);
    if (data.description !== undefined) endpoint.description = String(data.description);
    if (events) endpoint.events = events;
    if (data.active !== undefined) {
      if (data.active && !endpoint.active) {
        endpoint.consecutive_failures = 0;
        endpoint.disabled_at = null;
      }
      endpoint.active = !!data.active;
    }
    return json(endpointOut(endpoint));
  });
  r.delete("/webhooks/endpoints/:id", (ctx) => {
    const endpoint = ownEndpoint(ctx);
    ctx.db.endpoints = ctx.db.endpoints.filter((e) => e !== endpoint);
    ctx.db.deliveries = ctx.db.deliveries.filter((d) => d.endpoint !== endpoint.id);
    return noContent();
  });
  r.post("/webhooks/endpoints/:id/rotate-secret", (ctx) => {
    const endpoint = ownEndpoint(ctx);
    endpoint._secret = `whsec_${ctx.db.random.chars(43, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_")}`;
    return json({ secret: endpoint._secret });
  });
  r.post("/webhooks/endpoints/:id/test", (ctx) => {
    const endpoint = ownEndpoint(ctx);
    const ok = !endpoint.url.includes("legacy");
    const now = new Date().toISOString();
    const delivery: MockDelivery = {
      id: ctx.db.id(),
      endpoint: endpoint.id,
      event_id: `evt_${ctx.db.random.chars(20)}`,
      event: "ping",
      status: ok ? "success" : "failed",
      attempts: 1,
      next_attempt_at: null,
      last_status_code: ok ? 200 : 502,
      last_error: ok ? "" : "HTTP 502",
      duration_ms: ok ? 128 : 3020,
      created_at: now,
      delivered_at: ok ? now : null,
      payload: { id: `evt_${ctx.db.random.chars(12)}`, type: "ping", created_at: now, data: {} },
      response_excerpt: ok ? "{\"ok\":true}" : "Bad Gateway",
      _owner: ctx.user.id,
    };
    ctx.db.deliveries.unshift(delivery);
    return json({
      delivery: delivery.id,
      status: delivery.status,
      status_code: delivery.last_status_code,
      duration_ms: delivery.duration_ms,
      error: delivery.last_error,
    });
  });
  r.get("/webhooks/endpoints/:id/deliveries", (ctx) => {
    const endpoint = ownEndpoint(ctx);
    const rows = query(ctx.db.deliveries.filter((d) => d.endpoint === endpoint.id), ctx.url, {
      ordering: ["created_at"],
      defaultOrdering: "-created_at",
      filters: { status: (d, v) => d.status === v, event: (d, v) => d.event === v },
    });
    return json(page(rows, ctx.url, deliveryOut));
  });
  r.get("/webhooks/deliveries/:id", (ctx) => {
    const d = ctx.db.deliveries.find((x) => x._owner === ctx.user.id && x.id === ctx.params.id);
    if (!d) throw notFound();
    return json(pub(d));
  });
  r.post("/webhooks/deliveries/:id/redeliver", (ctx) => {
    const d = ctx.db.deliveries.find((x) => x._owner === ctx.user.id && x.id === ctx.params.id);
    if (!d) throw notFound();
    const endpoint = ctx.db.endpoints.find((e) => e.id === d.endpoint);
    if (!endpoint?.active) throw fail(409, "endpoint_inactive", "Turn the endpoint on first.");
    const now = new Date().toISOString();
    const copy: MockDelivery = {
      ...d,
      id: ctx.db.id(),
      status: "success",
      attempts: 1,
      next_attempt_at: null,
      last_status_code: 200,
      last_error: "",
      duration_ms: 142,
      created_at: now,
      delivered_at: now,
      response_excerpt: "{\"ok\":true}",
    };
    ctx.db.deliveries.unshift(copy);
    return json(deliveryOut(copy), 202);
  });

  // RBAC
  r.get("/rbac/features/me", ({ db, user }) => json({ features: (db.me(user).extra.features ?? []) as string[] }));
  r.get("/rbac/roles", (ctx) => json(page(query(ctx.db.roles, ctx.url, { search: ["name"], ordering: ["name"], defaultOrdering: "name" }), ctx.url)), "staff");
  r.post(
    "/rbac/roles",
    async (ctx) => {
      const data = await ctx.body();
      const v = new Validator(data);
      const name = v.required("name");
      v.throwIfAny();
      if (ctx.db.roles.some((role) => role.name === name)) {
        throw validation({ name: { code: "role_taken", message: "A role with this name already exists." } });
      }
      const permissions = Array.isArray(data.permissions) ? data.permissions.map(String) : [];
      const unknown = permissions.find((p) => !ctx.db.permissions.some((x) => x.codename === p));
      if (unknown) throw validation({ permissions: { code: "unknown_permission", message: `Unknown permission: ${unknown}.` } });
      const role = { id: ctx.db.id(), name: name!, description: String(data.description ?? ""), is_default: !!data.is_default, permissions };
      ctx.db.roles.push(role);
      return json(role, 201);
    },
    "staff",
  );
  r.patch(
    "/rbac/roles/:id",
    async (ctx) => {
      const role = ctx.db.roles.find((x) => x.id === ctx.params.id);
      if (!role) throw notFound();
      const data = await ctx.body();
      if (data.name !== undefined) role.name = String(data.name);
      if (data.description !== undefined) role.description = String(data.description);
      if (data.is_default !== undefined) role.is_default = !!data.is_default;
      if (Array.isArray(data.permissions)) role.permissions = data.permissions.map(String);
      return json(role);
    },
    "staff",
  );
  r.delete(
    "/rbac/roles/:id",
    (ctx) => {
      const role = ctx.db.roles.find((x) => x.id === ctx.params.id);
      if (!role) throw notFound();
      ctx.db.roles = ctx.db.roles.filter((x) => x !== role);
      for (const u of ctx.db.users) u.roles = u.roles.filter((n) => n !== role.name);
      return noContent();
    },
    "staff",
  );
  r.get(
    "/rbac/permissions",
    (ctx) => json(page(query(ctx.db.permissions, ctx.url, { search: ["codename", "name", "app_label", "model"], defaultOrdering: "codename" }), ctx.url)),
    "staff",
  );
  const roleChange = (add: boolean) => async (ctx: Ctx) => {
    const user = ctx.db.user(ctx.params.userId);
    if (!user) throw fail(400, "unknown_user", "Unknown user.");
    const data = await ctx.body();
    const name = String(data.role ?? ctx.url.searchParams.get("role") ?? "");
    if (!ctx.db.roles.some((x) => x.name === name)) throw fail(400, "unknown_role", "Unknown role.");
    user.roles = add ? [...new Set([...user.roles, name])] : user.roles.filter((x) => x !== name);
    return json({ roles: user.roles });
  };
  r.post("/rbac/users/:userId/roles", roleChange(true), "staff");
  r.delete("/rbac/users/:userId/roles", roleChange(false), "staff");
  r.get(
    "/rbac/features",
    (ctx) =>
      json(
        page(
          query(ctx.db.features, ctx.url, {
            search: ["key", "description"],
            ordering: ["key", "created_at", "updated_at", "rollout_percent"],
            defaultOrdering: "key",
            filters: { enabled: (f, v) => truthy(v) === undefined || !!f.enabled === truthy(v) },
          }),
          ctx.url,
        ),
      ),
    "staff",
  );

  // Staff
  r.get(
    "/staff/users",
    (ctx) => {
      const rows = query(ctx.db.users, ctx.url, {
        search: ["email", "name"],
        ordering: ["date_joined", "email", "last_login", "name"],
        defaultOrdering: "-date_joined",
        filters: {
          is_active: (u, v) => truthy(v) === undefined || u.is_active === truthy(v),
          is_staff: (u, v) => truthy(v) === undefined || u.is_staff === truthy(v),
          email_verified: (u, v) => truthy(v) === undefined || u.email_verified === truthy(v),
          role: (u, v) => u.roles.includes(v),
        },
      });
      return json(page(rows, ctx.url, (u) => ctx.db.staffUser(u)));
    },
    "staff",
  );
  r.get("/staff/stats", ({ db }) => {
    const now = Date.now();
    const DAY = 86_400_000;
    const joinedWithin = (days: number) => db.users.filter((u) => now - new Date(u.date_joined).getTime() <= days * DAY).length;
    const signups = Array.from({ length: 30 }, (_, i) => {
      const day = new Date(now - (29 - i) * DAY).toISOString().slice(0, 10);
      return { date: day, count: db.users.filter((u) => u.date_joined.slice(0, 10) === day).length + ((i * 7) % 5) };
    });
    return json({
      users_total: db.users.length,
      users_active: db.users.filter((u) => u.is_active).length,
      users_new_7d: joinedWithin(7),
      users_new_30d: joinedWithin(30),
      sessions_active: db.sessions.length,
      signups_by_day: signups,
    });
  }, "staff");
  r.get("/staff/users/:id", (ctx) => json(staffDetail(ctx, staffTarget(ctx))), "staff");
  r.patch(
    "/staff/users/:id",
    async (ctx) => {
      const target = staffTarget(ctx);
      const data = await ctx.body();
      const self = target.id === ctx.user.id;
      if (self && (data.is_active === false || data.is_staff === false)) {
        throw fail(400, "cannot_modify_self", "You cannot deactivate or demote yourself.");
      }
      if (target.is_superuser && !ctx.user.is_superuser) {
        throw fail(403, "cannot_modify_superuser", "Only superusers can change superusers.");
      }
      if (data.name !== undefined) target.name = String(data.name);
      if (data.is_active !== undefined) {
        target.is_active = !!data.is_active;
        if (!target.is_active) ctx.db.sessions = ctx.db.sessions.filter((s) => s._owner !== target.id);
      }
      if (data.is_staff !== undefined) target.is_staff = !!data.is_staff;
      if (data.email_verified !== undefined) target.email_verified = !!data.email_verified;
      if (Array.isArray(data.roles)) {
        const unknown = data.roles.find((n: unknown) => !ctx.db.roles.some((x) => x.name === n));
        if (unknown !== undefined) throw fail(400, "unknown_role", "Unknown role.");
        target.roles = data.roles.map(String);
      }
      return json(staffDetail(ctx, target));
    },
    "staff",
  );
  r.delete(
    "/staff/users/:id",
    (ctx) => {
      const target = staffTarget(ctx);
      if (target.id === ctx.user.id) throw fail(400, "cannot_modify_self", "You cannot delete yourself.");
      ctx.db.users = ctx.db.users.filter((u) => u !== target);
      ctx.db.sessions = ctx.db.sessions.filter((s) => s._owner !== target.id);
      return noContent();
    },
    "staff",
  );
  r.post(
    "/staff/users/:id/revoke-sessions",
    (ctx) => {
      const target = staffTarget(ctx);
      const before = ctx.db.sessions.length;
      ctx.db.sessions = ctx.db.sessions.filter((s) => s._owner !== target.id);
      return json({ count: before - ctx.db.sessions.length });
    },
    "staff",
  );
  r.post(
    "/staff/users/:id/password-reset",
    (ctx) => {
      const target = staffTarget(ctx);
      if (!target.is_active) throw fail(400, "user_inactive", "This account is deactivated.");
      return noContent(202);
    },
    "staff",
  );
  r.get(
    "/staff/bans",
    (ctx) =>
      json(
        page(
          query(ctx.db.bans, ctx.url, {
            search: ["network", "reason"],
            ordering: ["created_at", "expires_at", "network"],
            defaultOrdering: "-created_at",
          }),
          ctx.url,
        ),
      ),
    "staff",
  );
  r.post(
    "/staff/bans",
    async (ctx) => {
      const data = await ctx.body();
      const v = new Validator(data);
      const network = v.required("network");
      if (network && !/^[0-9a-f.:]+(\/\d{1,3})?$/i.test(network)) {
        v.add("network", "invalid_network", "Enter an IP address or a network like 10.0.0.0/8.");
      }
      v.throwIfAny();
      if (network === "203.0.113.24") throw fail(400, "cannot_ban_self", "This would ban your own address.");
      const ban = {
        id: ctx.db.id(),
        network: network!,
        reason: String(data.reason ?? ""),
        expires_at: (data.expires_at as string | null | undefined) ?? null,
        is_active: true,
        created_by: ctx.user.id,
        created_at: new Date().toISOString(),
      };
      ctx.db.bans.unshift(ban);
      return json(ban, 201);
    },
    "staff",
  );
  r.delete(
    "/staff/bans/:id",
    (ctx) => {
      const ban = ctx.db.bans.find((b) => b.id === ctx.params.id);
      if (!ban) throw notFound();
      ctx.db.bans = ctx.db.bans.filter((b) => b !== ban);
      return noContent();
    },
    "staff",
  );

  // Generic collection of the demo project, following the list conventions
  r.get(
    "/catalog/products",
    (ctx) => {
      const rows = query(ctx.db.products, ctx.url, {
        search: ["name", "sku", "category"],
        ordering: ["name", "price", "stock", "created_at"],
        defaultOrdering: "-created_at",
        filters: {
          status: (p, v) => p.status === v,
          category: (p, v) => p.category.toLowerCase() === v.toLowerCase(),
          low_stock: (p, v) => {
            const flag = truthy(v);
            return flag === undefined ? true : flag ? p.stock < 10 : p.stock >= 10;
          },
        },
      });
      return json(page(rows, ctx.url));
    },
    "public",
  );
  r.get(
    "/catalog/products/:id",
    (ctx) => {
      const product = ctx.db.products.find((p) => p.id === ctx.params.id);
      if (!product) throw notFound();
      return json(product);
    },
    "public",
  );
}
