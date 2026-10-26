// End to end: the built client against a running pleate-backend (apps/backend-demo).
//   PLEATE_E2E_URL=http://localhost:8000/api node --test e2e/backend.e2e.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

import { createPleateClient } from "../dist/index.js";

const BASE = process.env.PLEATE_E2E_URL ?? "http://localhost:8000/api";
const ORIGIN = new URL(BASE).origin;

/** fetch with a cookie jar and the Origin/Referer Django's CSRF check wants. */
function cookieFetch() {
  const jar = new Map();
  const fetcher = async (input, init = {}) => {
    const headers = new Headers(init.headers);
    if (jar.size) headers.set("Cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
    headers.set("Origin", ORIGIN);
    headers.set("Referer", `${ORIGIN}/`);
    const csrf = jar.get("csrftoken");
    if (csrf && !headers.has("X-CSRFToken")) headers.set("X-CSRFToken", csrf);
    const res = await fetch(input, { ...init, headers, redirect: "manual" });
    for (const line of res.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(";");
      const [name, value] = pair.split("=");
      const expired = attrs.some((a) => /max-age=0|expires=thu, 01 jan 1970/i.test(a.trim()));
      if (expired || value === '""') jar.delete(name.trim());
      else jar.set(name.trim(), value);
    }
    return res;
  };
  return { fetcher, jar };
}

function client() {
  const { fetcher, jar } = cookieFetch();
  return { api: createPleateClient({ baseUrl: BASE, fetch: fetcher, locale: "en" }), jar };
}

const email = `e2e-${Date.now()}@plate.dev`;
const password = "e2e-strong-password-42";

test("signup, me, logout, login", async () => {
  const { api } = client();
  const res = await api.auth.signup({ email, password, name: "E2E" });
  assert.equal(res.user.email, email);
  assert.equal((await api.auth.me()).email, email);
  await api.auth.logout();
  await assert.rejects(api.auth.me(), (e) => e.code === "not_authenticated");
  const login = await api.auth.login({ email, password, remember: true });
  assert.equal(login.mfa_required, false);
  assert.equal(login.user.email, email);
});

test("errors carry stable codes and translated messages", async () => {
  const { api } = client();
  await assert.rejects(api.auth.login({ email, password: "wrong-password", remember: false }), (e) => {
    assert.equal(e.code, "invalid_credentials");
    return true;
  });
  const it = createPleateClient({ baseUrl: BASE, fetch: cookieFetch().fetcher, locale: "it" });
  await assert.rejects(it.auth.signup({ email: "bad", password: "x" }), (e) => {
    assert.equal(e.code, "validation_error");
    assert.ok(e.fieldErrors().email);
    return true;
  });
});

test("lists: page, search, ordering, filters on a project resource", async () => {
  const { api } = client();
  await api.auth.login({ email: "ada@plate.dev", password: "plate-demo-2026", remember: false });
  const page = await api.list("/catalog/products", { page: 2, page_size: 10, ordering: "-price", status: "active" });
  assert.equal(page.page, 2);
  assert.equal(page.results.length, 10);
  assert.ok(page.count > 10);
  const prices = page.results.map((p) => Number(p.price));
  assert.deepEqual(prices, [...prices].sort((a, b) => b - a));
  assert.ok(page.results.every((p) => p.status === "active"));
  const found = await api.list("/catalog/products", { search: "PL-1007" });
  assert.equal(found.results[0].sku, "PL-1007");
  await assert.rejects(api.list("/catalog/products", { ordering: "secret" }), (e) => e.code === "invalid_ordering");
});

test("sessions, mfa status, api keys", async () => {
  const { api } = client();
  await api.auth.login({ email, password, remember: false });
  const sessions = await api.sessions.list();
  assert.ok(sessions.some((s) => s.current));
  assert.equal((await api.mfa.status()).enabled, false);
  const setup = await api.mfa.setup();
  assert.match(setup.otpauth_url, /^otpauth:\/\/totp\//);
  const created = await api.apiKeys.create({ name: "ci", scopes: ["read"] });
  assert.match(created.key, /^pl_/);
  const viaKey = createPleateClient({ baseUrl: BASE, headers: { Authorization: `Bearer ${created.key}` }, csrf: false });
  assert.equal((await viaKey.auth.me()).email, email);
  await api.apiKeys.revoke(created.id);
  await assert.rejects(viaKey.auth.me(), (e) => e.status === 401 || e.status === 403);
});

test("files upload and download", async () => {
  const { api } = client();
  await api.auth.login({ email, password, remember: false });
  const blob = new Blob(["hello from the e2e test\n"], { type: "text/plain" });
  const file = new File([blob], "hello.txt", { type: "text/plain" });
  const item = await api.files.upload(file, { purpose: "e2e" });
  assert.equal(item.content_type, "text/plain");
  const list = await api.files.list({ search: "hello" });
  assert.ok(list.results.some((f) => f.id === item.id));
  const res = await api.http.raw("GET", `/files/${item.id}/download`);
  assert.equal(await res.text(), "hello from the e2e test\n");
  await api.files.remove(item.id);
});

test("ai chat streams over SSE", async () => {
  const { api } = client();
  await api.auth.login({ email, password, remember: false });
  const conv = await api.ai.createConversation({});
  const events = [];
  let text = "";
  for await (const e of api.ai.send(conv.id, { content: "hello streaming world" })) {
    events.push(e.event);
    if (e.event === "delta") text += e.data.text;
  }
  assert.equal(events[0], "user_message");
  assert.equal(events.at(-1), "done");
  assert.ok(events.includes("delta"));
  assert.match(text, /hello streaming world/);
  const history = await api.ai.messages(conv.id);
  assert.equal(history.results.length, 2);
});

test("notifications, billing plans, marketing", async () => {
  const { api } = client();
  await api.auth.login({ email: "ada@plate.dev", password: "plate-demo-2026", remember: false });
  const feed = await api.notifications.list({ page_size: 5 });
  assert.ok(feed.results.length > 0);
  const { count } = await api.notifications.unreadCount();
  assert.equal(typeof count, "number");
  const plans = await api.billing.plans();
  assert.deepEqual(plans.plans.map((p) => p.id), ["free", "pro"]);
  const anon = client().api;
  const sub = await anon.marketing.subscribe(`news-${Date.now()}@plate.dev`);
  assert.equal(typeof sub.confirmation_required, "boolean");
  const contact = await anon.marketing.contact({
    name: "Ada",
    email: "ada@plate.dev",
    subject: "Hi",
    message: "Just testing the contact form end to end.",
    website: "",
  });
  assert.equal(contact.received, true);
});

test("delete account", async () => {
  const { api } = client();
  await api.auth.login({ email, password, remember: false });
  await api.auth.deleteAccount({ password });
  await assert.rejects(
    api.auth.login({ email, password, remember: false }),
    (e) => e.code === "invalid_credentials",
  );
});
