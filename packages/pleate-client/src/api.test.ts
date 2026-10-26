import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { ChatEvent } from "./api.ts";
import { ApiError } from "./errors.ts";
import { createMockHandlers, DEMO_BACKUP_CODE, DEMO_PASSWORD, DEMO_TOTP_CODE, MFA_EMAIL, VALID_TOKEN } from "./mock/index.ts";
import type { MockProduct } from "./mock/index.ts";
import { createTestBackend, createTestClient } from "./test/backend.ts";

const { db, server } = createTestBackend();
let api = createTestClient();

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
beforeEach(() => {
  db.reset();
  api = createTestClient();
});
afterAll(() => server.close());

async function expectError(promise: Promise<unknown>, code: string, status?: number): Promise<ApiError> {
  const error = await promise.then(
    () => {
      throw new Error(`expected ${code}`);
    },
    (e) => e,
  );
  expect(error).toBeInstanceOf(ApiError);
  expect(error.code).toBe(code);
  if (status !== undefined) expect(error.status).toBe(status);
  return error;
}

async function collect<T>(stream: AsyncGenerator<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const e of stream) out.push(e);
  return out;
}

describe("mock backend basics", () => {
  it("answers unknown routes with a JSON 404 and wrong methods with 405", async () => {
    await expectError(api.http.get("/nope"), "not_found", 404);
    await expectError(api.http.put("/auth/sessions/revoke-others"), "method_not_allowed", 405);
  });

  it("rejects unsafe requests without a CSRF header", async () => {
    const raw = await fetch("http://localhost/api/auth/logout", { method: "POST" });
    expect(raw.status).toBe(403);
    expect((await raw.json()).error.code).toBe("csrf_failed");
  });
});

describe("auth", () => {
  it("returns a csrf token", async () => {
    expect(await api.auth.csrf()).toMatch(/^mock-/);
  });

  it("logs out, answers 401 when signed out, and logs back in", async () => {
    const me = await api.auth.me();
    expect(me).toMatchObject({ email: "ada@plate.dev", display_name: "Ada Palmer", is_staff: true, has_password: true });
    expect(me.extra).toMatchObject({ roles: ["admin"], mfa_enabled: false, oauth_providers: ["github"], subscription: null });
    expect(me.extra.features).toContain("new-dashboard");
    expect(me.extra.permissions).toContain("pleate_accounts.view_user");
    await api.auth.logout();
    await expectError(api.auth.me(), "not_authenticated", 401);
    await expectError(api.auth.login({ email: "ada@plate.dev", password: "wrong-password", remember: false }), "invalid_credentials", 400);
    const bad = await expectError(api.auth.login({ email: "not-an-email", password: "", remember: false }), "validation_error", 400);
    expect(bad.fields.email[0].code).toBe("invalid");
    expect(bad.fields.password[0].code).toBe("blank");
    const result = await api.auth.login({ email: "ada@plate.dev", password: DEMO_PASSWORD, remember: true });
    expect(result.mfa_required).toBe(false);
    expect(result.user?.email).toBe("ada@plate.dev");
    expect((await api.auth.me()).id).toBe(result.user?.id);
  });

  it("signs up with field errors for taken emails and weak passwords", async () => {
    await api.auth.logout();
    const taken = await expectError(api.auth.signup({ email: "ada@plate.dev", password: "long enough password" }), "validation_error");
    expect(taken.fieldErrors()).toEqual({ email: "An account with this email already exists." });
    expect(taken.fields.email[0].code).toBe("email_taken");
    const weak = await expectError(api.auth.signup({ email: "new@plate.dev", password: "short" }), "validation_error");
    expect(weak.fields.password[0]).toEqual({
      code: "weak_password",
      message: "This password is too short. It must contain at least 10 characters.",
    });
    const result = await api.auth.signup({ email: "New@Plate.dev", password: "a long password", name: "Nina" });
    expect(result.verification_required).toBe(false);
    expect(result.user).toMatchObject({ email: "new@plate.dev", name: "Nina", email_verified: false, is_staff: false });
    expect(result.user.extra.roles).toEqual(["viewer"]);
    expect((await api.auth.me()).email).toBe("new@plate.dev");
  });

  it("updates the profile and preferences", async () => {
    const me = await api.auth.updateMe({ name: "Ada P.", locale: "it", preferences: { density: "compact" } });
    expect(me).toMatchObject({ name: "Ada P.", display_name: "Ada P.", locale: "it", preferences: { theme: "system", density: "compact" } });
    const bad = await expectError(api.auth.updateMe({ locale: "fr" as "it" }), "validation_error");
    expect(bad.fields.locale[0].code).toBe("invalid_choice");
  });

  it("changes the password", async () => {
    const wrong = await expectError(api.auth.changePassword({ current_password: "nope", new_password: "another password" }), "validation_error");
    expect(wrong.fields.current_password[0].code).toBe("wrong_password");
    await api.auth.changePassword({ current_password: DEMO_PASSWORD, new_password: "another password" });
    await api.auth.logout();
    await expectError(api.auth.login({ email: "ada@plate.dev", password: DEMO_PASSWORD, remember: false }), "invalid_credentials");
    await api.auth.login({ email: "ada@plate.dev", password: "another password", remember: false });
  });

  it("resets passwords with the valid token only, always answering 202 to requests", async () => {
    await expect(api.auth.requestPasswordReset("nobody@plate.dev")).resolves.toBeUndefined();
    await expectError(api.auth.requestPasswordReset("nope"), "validation_error");
    expect(await api.auth.validateResetToken(VALID_TOKEN)).toEqual({ valid: true });
    expect(await api.auth.validateResetToken("expired")).toEqual({ valid: false });
    await expectError(api.auth.resetPassword("expired", "a brand new password"), "invalid_token", 400);
    const weak = await expectError(api.auth.resetPassword(VALID_TOKEN, "short"), "validation_error");
    expect(weak.fields.new_password[0].code).toBe("weak_password");
    await api.auth.resetPassword(VALID_TOKEN, "a brand new password");
    await expectError(api.auth.me(), "not_authenticated");
    await api.auth.login({ email: "ada@plate.dev", password: "a brand new password", remember: false });
  });

  it("verifies emails and handles email changes", async () => {
    await expectError(api.auth.verifyEmail("bad"), "invalid_token");
    expect((await api.auth.verifyEmail(VALID_TOKEN)).email_verified).toBe(true);
    await expect(api.auth.resendVerification()).resolves.toBeUndefined();
    const taken = await expectError(api.auth.changeEmail(MFA_EMAIL, DEMO_PASSWORD), "validation_error");
    expect(taken.fields.new_email[0].code).toBe("email_taken");
    await expect(api.auth.changeEmail("ada.new@plate.dev", DEMO_PASSWORD)).resolves.toBeUndefined();
    expect((await api.auth.confirmEmailChange(VALID_TOKEN)).email).toBe("ada@plate.dev");
  });

  it("uploads and removes the avatar, exports data and deletes the account", async () => {
    const png = new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });
    const progress: number[] = [];
    const me = await api.auth.uploadAvatar(png, { onProgress: (p) => progress.push(p) });
    expect(me.avatar_url).toMatch(/\/auth\/avatar\/[0-9a-f]+\?v=/);
    expect(progress.at(-1)).toBe(1);
    const image = await fetch(me.avatar_url!);
    expect(image.headers.get("Content-Type")).toBe("image/png");
    expect((await api.auth.removeAvatar()).avatar_url).toBeNull();
    const data = await api.auth.exportData();
    expect(data).toHaveProperty("account");
    expect(data).toHaveProperty("exported_at");
    await expectError(api.auth.deleteAccount({ password: "nope" }), "wrong_password");
    await api.auth.deleteAccount({ password: DEMO_PASSWORD });
    await expectError(api.auth.me(), "not_authenticated");
    await expectError(api.auth.login({ email: "ada@plate.dev", password: DEMO_PASSWORD, remember: false }), "invalid_credentials");
  });
});

describe("sessions", () => {
  it("lists devices with the current one, revokes one and the others", async () => {
    const sessions = await api.sessions.list();
    expect(sessions).toHaveLength(3);
    expect(sessions.filter((s) => s.current)).toHaveLength(1);
    expect(sessions.find((s) => s.current)).toMatchObject({ browser: "Chrome", os: "macOS", mobile: false });
    expect(sessions.find((s) => s.mobile)).toMatchObject({ browser: "Safari", os: "iOS" });
    const other = sessions.find((s) => !s.current)!;
    await api.sessions.revoke(other.id);
    expect(await api.sessions.list()).toHaveLength(2);
    await expectError(api.sessions.revoke("missing"), "not_found", 404);
    expect(await api.sessions.revokeOthers()).toEqual({ count: 1 });
    const left = await api.sessions.list();
    expect(left).toHaveLength(1);
    await api.sessions.revoke(left[0].id);
    await expectError(api.auth.me(), "not_authenticated");
  });
});

describe("mfa", () => {
  it("enrolls, regenerates backup codes and disables", async () => {
    expect(await api.mfa.status()).toEqual({ enabled: false, confirmed_at: null, backup_codes_remaining: 0 });
    await expectError(api.mfa.confirm(DEMO_TOTP_CODE), "mfa_setup_required");
    const setup = await api.mfa.setup();
    expect(setup.secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(setup.otpauth_url).toContain("otpauth://totp/Plate:");
    expect(setup.qr_svg).toMatch(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    await expectError(api.mfa.confirm("000000"), "invalid_code");
    const { backup_codes } = await api.mfa.confirm(DEMO_TOTP_CODE);
    expect(backup_codes).toHaveLength(10);
    backup_codes.forEach((c) => expect(c).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}$/));
    await expectError(api.mfa.setup(), "mfa_already_enabled", 409);
    expect(await api.mfa.status()).toMatchObject({ enabled: true, backup_codes_remaining: 10 });
    expect((await api.auth.me()).extra.mfa_enabled).toBe(true);
    const fresh = await api.mfa.regenerateBackupCodes(DEMO_TOTP_CODE);
    expect(fresh.backup_codes).not.toEqual(backup_codes);
    await expectError(api.mfa.disable({ password: "wrong", code: DEMO_TOTP_CODE }), "wrong_password");
    await expectError(api.mfa.disable({ password: DEMO_PASSWORD, code: "999999" }), "invalid_code");
    await api.mfa.disable({ password: DEMO_PASSWORD, code: fresh.backup_codes[0] });
    expect((await api.mfa.status()).enabled).toBe(false);
  });

  it("asks the second factor on login and verifies codes, backup codes and attempts", async () => {
    await api.auth.logout();
    await expectError(api.mfa.verify({ code: DEMO_TOTP_CODE }), "mfa_pending_expired");
    const first = await api.auth.login({ email: MFA_EMAIL, password: DEMO_PASSWORD, remember: false });
    expect(first).toEqual({ mfa_required: true, methods: ["totp", "backup_code"] });
    await expectError(api.auth.me(), "not_authenticated");
    await expectError(api.mfa.verify({}), "code_required");
    const wrong = await expectError(api.mfa.verify({ code: "000000" }), "invalid_code");
    expect(wrong.body.attempts_left).toBe(4);
    const ok = await api.mfa.verify({ code: DEMO_TOTP_CODE });
    expect(ok.mfa_required).toBe(false);
    expect(ok.user.email).toBe(MFA_EMAIL);
    expect((await api.auth.me()).extra.subscription).toMatchObject({ plan_id: "pro", status: "active" });

    await api.auth.logout();
    await api.auth.login({ email: MFA_EMAIL, password: DEMO_PASSWORD, remember: false });
    expect((await api.mfa.verify({ backup_code: DEMO_BACKUP_CODE })).user.email).toBe(MFA_EMAIL);

    await api.auth.logout();
    await api.auth.login({ email: MFA_EMAIL, password: DEMO_PASSWORD, remember: false });
    for (let left = 4; left >= 0; left--) {
      const e = await expectError(api.mfa.verify({ code: "111111" }), "invalid_code");
      expect(e.body.attempts_left).toBe(left);
    }
    await expectError(api.mfa.verify({ code: DEMO_TOTP_CODE }), "mfa_pending_expired");
  });
});

describe("oauth", () => {
  it("lists providers and accounts, builds start URLs and unlinks", async () => {
    expect(await api.oauth.providers()).toEqual([
      { id: "google", name: "Google" },
      { id: "github", name: "GitHub" },
    ]);
    expect(api.oauth.startUrl("google", { next: "/app", remember: true })).toBe(
      "http://localhost/api/auth/oauth/google/start?next=%2Fapp&remember=1",
    );
    const start = await fetch(api.oauth.startUrl("github", { mode: "link" }), { redirect: "manual" });
    expect(start.status).toBe(302);
    const accounts = await api.oauth.accounts();
    expect(accounts.map((a) => a.provider)).toEqual(["github"]);
    await api.oauth.unlink(accounts[0].id);
    expect(await api.oauth.accounts()).toEqual([]);
    await expectError(api.oauth.unlink("missing"), "not_found");
    const unknown = await fetch("http://localhost/api/auth/oauth/apple/start", { redirect: "manual" });
    expect((await unknown.json()).error.code).toBe("oauth_unknown_provider");
  });
});

describe("api keys", () => {
  it("lists, creates (the key shown once), renames and revokes", async () => {
    const list = await api.apiKeys.list();
    expect(list).toMatchObject({ count: 4, page: 1, page_size: 20, page_count: 1 });
    expect(list.results.map((k) => k.status)).toEqual(["active", "active", "active", "revoked"]);
    const created = await api.apiKeys.create({ name: "Zapier", scopes: ["write"], expires_in_days: 30 });
    expect(created.key).toMatch(new RegExp(`^pl_${created.prefix}_[A-Za-z0-9_-]{43}$`));
    expect(created.scopes).toEqual(["read", "write"]);
    expect(created.display).toBe(`pl_${created.prefix}_...`);
    expect(created.expires_at).not.toBeNull();
    const again = await api.apiKeys.list({ search: "zap" });
    expect(again.results).toHaveLength(1);
    expect(again.results[0]).not.toHaveProperty("key");
    expect((await api.apiKeys.rename(created.id, "Zapier prod")).name).toBe("Zapier prod");
    await api.apiKeys.revoke(created.id);
    const byName = await api.apiKeys.list({ ordering: "name" });
    expect(byName.results.find((k) => k.id === created.id)?.status).toBe("revoked");
    expect(byName.results.map((k) => k.name)).toEqual([...byName.results.map((k) => k.name)].sort((a, b) => a.localeCompare(b)));
    const bad = await expectError(api.apiKeys.create({ name: "" }), "validation_error");
    expect(bad.fields.name[0].code).toBe("blank");
  });
});

describe("files", () => {
  it("uploads, lists, renames, downloads, reports usage and deletes", async () => {
    const before = await api.files.usage();
    const file = await api.files.upload(new File(["# notes"], "notes.md", { type: "" }), { purpose: "chat" });
    expect(file).toMatchObject({ name: "notes.md", size: 7, content_type: "text/plain", purpose: "chat", status: "ready" });
    expect(file.download_url).toBe(`http://localhost/api/files/${file.id}/download`);
    expect(await api.files.usage()).toEqual({ used: before.used + 7, quota: before.quota, count: before.count + 1 });
    const page1 = await api.files.list({ page_size: 3 });
    expect(page1.results[0].id).toBe(file.id);
    expect(page1).toMatchObject({ count: 8, page_size: 3, page_count: 3 });
    expect((await api.files.list({ purpose: "image" })).count).toBe(3);
    expect((await api.files.list({ search: "SPRING" })).results.map((f) => f.name)).toEqual(["spring-menu.pdf"]);
    expect((await api.files.list({ ordering: "-size", page_size: 1 })).results[0].name).toBe("glaze-samples.jpg");
    expect((await api.files.rename(file.id, "notes-final.md")).name).toBe("notes-final.md");
    expect((await api.files.get(file.id)).name).toBe("notes-final.md");
    const download = await fetch(api.files.downloadUrl(file.id));
    expect(await download.text()).toBe("# notes");
    expect(download.headers.get("Content-Disposition")).toContain("notes-final.md");
    await api.files.remove(file.id);
    await expectError(api.files.get(file.id), "not_found", 404);
    await expectError(api.files.list({ page: 99 }), "invalid_page", 404);
    await expectError(api.files.presign({ name: "a", size: 1, content_type: "text/plain", purpose: "" }), "presign_not_supported");
    await expectError(api.files.complete("x"), "upload_not_found");
  });

  it("refuses files over 25 MB", async () => {
    const big = new File([new Uint8Array(25 * 1024 * 1024 + 1)], "big.bin");
    const error = await expectError(api.files.upload(big), "file_too_large", 413);
    expect(error.body.max_size).toBe(25 * 1024 * 1024);
  });
});

describe("notifications", () => {
  it("pages with cursors, filters, marks read/unread and clears", async () => {
    expect(await api.notifications.unreadCount()).toEqual({ count: 11 });
    const first = await api.notifications.list({ page_size: 10 });
    expect(first.results).toHaveLength(10);
    expect(first.previous_cursor).toBeNull();
    expect(first.next_cursor).toBeTruthy();
    const dates = first.results.map((n) => n.created_at);
    expect(dates).toEqual([...dates].sort().reverse());
    const second = await api.notifications.list({ page_size: 10, cursor: first.next_cursor });
    expect(second.results[0].id).not.toBe(first.results[0].id);
    expect(second.previous_cursor).toBeTruthy();
    let all = 0;
    let cursor: string | null | undefined;
    do {
      const p = await api.notifications.list({ page_size: 7, cursor });
      all += p.results.length;
      cursor = p.next_cursor;
    } while (cursor);
    expect(all).toBe(34);
    const unread = await api.notifications.list({ unread: true, page_size: 50 });
    expect(unread.results).toHaveLength(11);
    expect(unread.results.every((n) => !n.read)).toBe(true);
    expect((await api.notifications.list({ kind: "billing.payment_failed", page_size: 50 })).results.every((n) => n.kind === "billing.payment_failed")).toBe(true);

    const target = unread.results[0];
    const read = await api.notifications.markRead(target.id);
    expect(read.read).toBe(true);
    expect(read.read_at).not.toBeNull();
    expect((await api.notifications.unreadCount()).count).toBe(10);
    expect((await api.notifications.markUnread(target.id)).read).toBe(false);
    expect(await api.notifications.markAllRead()).toEqual({ count: 11 });
    expect((await api.notifications.unreadCount()).count).toBe(0);
    await api.notifications.remove(target.id);
    expect(await api.notifications.clearRead()).toEqual({ count: 33 });
    expect((await api.notifications.list()).results).toEqual([]);
  });

  it("reads and replaces preferences, rejecting unknown channels", async () => {
    const prefs = await api.notifications.preferences();
    expect(prefs.available_channels).toEqual(["in_app", "email", "push"]);
    expect(prefs.channels["*"]).toEqual(["in_app"]);
    const next = await api.notifications.updatePreferences({ "*": ["in_app", "email"] });
    expect(next.channels).toEqual({ "*": ["in_app", "email"] });
    const bad = await expectError(api.notifications.updatePreferences({ "*": ["pigeon"] }), "validation_error");
    expect(bad.fields.channels[0].code).toBe("invalid_channel");
    expect(await api.notifications.pushPublicKey()).toEqual({ key: null });
    await api.notifications.subscribePush({ endpoint: "https://push.example/1", keys: { p256dh: "k", auth: "a" } });
    await api.notifications.unsubscribePush("https://push.example/1");
    await expectError(api.notifications.unsubscribePush("https://push.example/1"), "not_found");
  });

  it("streams the unread count first, then live changes", async () => {
    const controller = new AbortController();
    const events: { event: string; data: unknown }[] = [];
    const stream = api.notifications.stream(controller.signal);
    const first = await stream.next();
    events.push(first.value as { event: string; data: unknown });
    expect(events[0]).toMatchObject({ event: "unread_count", data: { count: 11 } });
    await api.notifications.markAllRead();
    const second = await stream.next();
    expect(second.value).toMatchObject({ event: "unread_count", data: { count: 0 } });
    controller.abort();
    await stream.return(undefined);
  });
});

describe("ai", () => {
  it("lists models, suggestions, usage and conversations", async () => {
    const models = await api.ai.models();
    expect(models.default).toBe("plate-swift");
    expect(models.models.map((m) => m.id)).toEqual(["plate-swift", "plate-sage", "plate-echo"]);
    expect((await api.ai.suggestions()).length).toBeGreaterThanOrEqual(4);
    expect((await api.ai.usage()).today).toMatchObject({ limit: 200000 });
    const convos = await api.ai.conversations({ archived: false });
    expect(convos.count).toBe(5);
    const stamps = convos.results.map((c) => c.last_message_at);
    expect(stamps).toEqual([...stamps].sort().reverse());
    expect((await api.ai.conversations({ archived: true })).count).toBe(1);
    expect((await api.ai.conversations({ pinned: true })).results[0].title).toBe("Holiday gift bundle ideas");
    expect((await api.ai.conversations({ search: "linen" })).results[0].title).toBe("Linen Napkin Set description");
  });

  it("creates, updates and deletes conversations", async () => {
    await expectError(api.ai.createConversation({ model: "gpt-nope" }), "invalid_model");
    const c = await api.ai.createConversation({});
    expect(c).toMatchObject({ title: "", model: "plate-swift", pinned: false, archived: false });
    const updated = await api.ai.updateConversation(c.id, { title: "Renamed", pinned: true });
    expect(updated).toMatchObject({ title: "Renamed", pinned: true });
    expect((await api.ai.conversation(c.id)).title).toBe("Renamed");
    await api.ai.deleteConversation(c.id);
    await expectError(api.ai.conversation(c.id), "not_found", 404);
  });

  it("pages messages latest first, each page in chronological order", async () => {
    const convo = (await api.ai.conversations({ search: "spring tasting" })).results[0];
    const latest = await api.ai.messages(convo.id, { page_size: 2 });
    expect(latest.results.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(latest.results[0].content).toBe("Can you make the main course vegetarian?");
    const older = await api.ai.messages(convo.id, { page_size: 2, cursor: latest.next_cursor });
    expect(older.results[0].content).toContain("spring tasting menu");
    expect(older.next_cursor).toBeNull();
  });

  it("streams an answer with the backend event order and saves it", async () => {
    const c = await api.ai.createConversation({});
    const events = (await collect(api.ai.send(c.id, { content: "Plan a dinner menu, cite a source" }))) as ChatEvent[];
    const names = events.map((e) => e.event);
    expect(names[0]).toBe("user_message");
    expect(names[1]).toBe("start");
    expect(names.at(-1)).toBe("done");
    expect(names).toContain("reasoning");
    expect(names).toContain("sources");
    expect(names.indexOf("sources")).toBeLessThan(names.indexOf("delta"));
    const deltas = events.filter((e) => e.event === "delta").map((e) => (e.data as { text: string }).text);
    expect(deltas.length).toBeGreaterThan(10);
    const done = events.at(-1) as Extract<ChatEvent, { event: "done" }>;
    expect(done.data.message.status).toBe("complete");
    expect(done.data.message.content).toBe(deltas.join(""));
    expect(done.data.message.sources.length).toBeGreaterThan(0);
    const start = events[1] as Extract<ChatEvent, { event: "start" }>;
    expect(start.data.message).toMatchObject({ role: "assistant", status: "streaming", content: "" });
    const history = await api.ai.messages(c.id);
    expect(history.results.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(history.results[1].content).toBe(deltas.join(""));
    const convo = await api.ai.conversation(c.id);
    expect(convo.title).toBe("Plan a dinner menu, cite a source");
    expect((await api.ai.usage()).today.output_tokens).toBeGreaterThan(5230);
  });

  it("reports provider errors inside the stream and validation errors before it", async () => {
    const c = await api.ai.createConversation({ model: "plate-echo" });
    const events = (await collect(api.ai.send(c.id, { content: "boom [error]" }))) as ChatEvent[];
    expect(events.map((e) => e.event)).toEqual(["user_message", "start", "reasoning", "delta", "error", "done"]);
    expect((events.at(-1) as Extract<ChatEvent, { event: "done" }>).data.message).toMatchObject({
      status: "error",
      error_code: "provider_error",
      content: "You",
    });
    await expectError(collect(api.ai.send(c.id, { content: "   " })), "empty_message", 400);
    await expectError(collect(api.ai.send(c.id, { content: "hi", model: "nope" })), "invalid_model");
    await expectError(collect(api.ai.send(c.id, { content: "hi", attachments: ["missing"] })), "attachment_not_found");
    const tooLong = await expectError(collect(api.ai.send(c.id, { content: "x".repeat(32_001) })), "validation_error");
    expect(tooLong.fields.content[0].code).toBe("message_too_long");
  });

  it("still saves the answer when the client goes away", async () => {
    server.resetHandlers(...createMockHandlers({ db, baseUrl: "http://localhost/api", latency: 0, streamDelay: 2 }));
    try {
      const c = await api.ai.createConversation({});
      const controller = new AbortController();
      let deltas = 0;
      try {
        for await (const event of api.ai.send(c.id, { content: "Summarize the orders" }, controller.signal)) {
          if (event.event === "delta" && ++deltas === 3) controller.abort();
        }
      } catch (error) {
        expect((error as Error).name).toBe("AbortError");
      }
      expect(deltas).toBe(3);
      // msw/node drains the body after an abort (no cancel reaches the mock), so the
      // answer ends as complete; in the browser a cancel ends it as stopped.
      let assistant;
      for (let i = 0; i < 100; i++) {
        assistant = (await api.ai.messages(c.id)).results.at(-1)!;
        if (assistant.status !== "streaming") break;
        await new Promise((r) => setTimeout(r, 10));
      }
      expect(["complete", "stopped"]).toContain(assistant!.status);
      expect(assistant!.content.split(" ").length).toBeGreaterThanOrEqual(3);
    } finally {
      server.resetHandlers();
    }
  });

  it("answers in JSON when asked to", async () => {
    const c = await api.ai.createConversation({ model: "plate-echo" });
    const result = await api.http.post<{ user_message: { content: string }; assistant_message: { content: string; status: string } }>(
      `/ai/conversations/${c.id}/messages`,
      { content: "hello there" },
    );
    expect(result.user_message.content).toBe("hello there");
    expect(result.assistant_message).toMatchObject({ content: "You said: hello there", status: "complete" });
  });

  it("stops a running answer and regenerates the last one", async () => {
    // Slow the words down so the stop request lands mid answer.
    server.resetHandlers(...createMockHandlers({ db, baseUrl: "http://localhost/api", latency: 0, streamDelay: 5 }));
    try {
      const c = await api.ai.createConversation({});
      const stream = api.ai.send(c.id, { content: "Describe the product" });
      const seen: ChatEvent[] = [];
      let stopped = false;
      for await (const event of stream) {
        seen.push(event);
        if (event.event === "delta" && !stopped) {
          stopped = true;
          const assistantId = (seen.find((e) => e.event === "start") as Extract<ChatEvent, { event: "start" }>).data.message.id;
          const stop = await api.ai.stop(assistantId);
          expect(stop).toMatchObject({ id: assistantId, role: "assistant", status: "streaming" });
        }
      }
      const done = seen.at(-1) as Extract<ChatEvent, { event: "done" }>;
      expect(done.event).toBe("done");
      expect(done.data.message.status).toBe("stopped");
      const fullLength = 50;
      expect(seen.filter((e) => e.event === "delta").length).toBeLessThan(fullLength);

      const userMessage = (seen[0] as Extract<ChatEvent, { event: "user_message" }>).data.message;
      await expectError(collect(api.ai.regenerate(userMessage.id)), "cannot_regenerate", 409);
      const again = (await collect(api.ai.regenerate(done.data.message.id))) as ChatEvent[];
      expect(again.map((e) => e.event)[0]).toBe("start");
      const final = again.at(-1) as Extract<ChatEvent, { event: "done" }>;
      expect(final.data.message.status).toBe("complete");
      expect(final.data.message.variants).toEqual([done.data.message.content]);
    } finally {
      server.resetHandlers();
    }
  });
});

describe("billing", () => {
  it("returns plans shaped for <Pricing> and the current plan", async () => {
    const plans = await api.billing.plans();
    expect(plans).toMatchObject({ currency: "USD", trial_days: 14, current_plan: "free" });
    expect(plans.plans.map((p) => p.id)).toEqual(["free", "pro", "team"]);
    const [free, pro, team] = plans.plans;
    expect(free).toMatchObject({ price: { monthly: 0, yearly: 0 }, amounts: { month: null, year: null }, intervals: [], current: true });
    expect(pro).toMatchObject({
      price: { monthly: 12, yearly: 10 },
      amounts: { month: 1200, year: 12000 },
      intervals: ["month", "year"],
      highlighted: true,
      badge: "Most popular",
      current: false,
      custom_price: null,
    });
    expect(team.price).toEqual({ monthly: 49, yearly: 39 });
    expect(pro.features).toContainEqual({ label: "Team members", included: false, hint: "Available on Team" });
    await api.auth.logout();
    expect((await api.billing.plans()).current_plan).toBeNull();
  });

  it("starts checkout and opens the portal", async () => {
    expect(await api.billing.subscription()).toEqual({ subscription: null });
    expect(await api.billing.checkout("pro", "year")).toEqual({ url: "#checkout-pro" });
    await expectError(api.billing.checkout("free", "month"), "invalid_plan");
    await expectError(api.billing.checkout("gold", "month"), "invalid_plan");
    expect(await api.billing.portal()).toEqual({ url: "#billing-portal" });
    await api.auth.logout();
    await api.auth.login({ email: MFA_EMAIL, password: DEMO_PASSWORD, remember: false });
    await api.mfa.verify({ code: DEMO_TOTP_CODE });
    expect((await api.billing.subscription()).subscription).toMatchObject({ plan_id: "pro", status: "active" });
    await expectError(api.billing.checkout("team", "month"), "already_subscribed", 409);
  });
});

describe("marketing", () => {
  it("subscribes, confirms, takes contact messages and runs the waitlist", async () => {
    await api.auth.logout();
    expect(await api.marketing.subscribe("reader@plate.dev", "footer")).toEqual({ confirmation_required: true });
    await expectError(api.marketing.subscribe("nope"), "validation_error");
    expect(await api.marketing.confirmSubscription(VALID_TOKEN)).toEqual({ email: "reader@plate.dev", status: "subscribed" });
    await expectError(api.marketing.unsubscribe("bad"), "invalid_token");
    expect(await api.marketing.contact({ name: "Ines", email: "ines@plate.dev", subject: "", message: "Do you ship to Spain?", website: "" })).toEqual({
      received: true,
    });
    const short = await expectError(api.marketing.contact({ name: "", email: "x", subject: "", message: "Hi", website: "" }), "validation_error");
    expect(Object.keys(short.fields).sort()).toEqual(["email", "message", "name"]);
    expect(short.fields.message[0].code).toBe("min_length");
    const joined = await api.marketing.joinWaitlist("third@plate.dev");
    expect(joined).toMatchObject({ position: 3, referrals: 0, invited: false });
    expect(await api.marketing.joinWaitlist("third@plate.dev")).toEqual(joined);
    const friend = await api.marketing.joinWaitlist("friend@plate.dev", joined.referral_code);
    expect(friend.position).toBe(4);
    expect(await api.marketing.waitlistStatus(joined.referral_code)).toEqual({ position: 1, referrals: 1 });
    await expectError(api.marketing.waitlistStatus("NOPE"), "not_found", 404);
  });
});

describe("activity, webhooks, rbac, staff", () => {
  it("lists my activity with cursors and everyone's for staff", async () => {
    await api.auth.logout();
    await api.auth.login({ email: "ada@plate.dev", password: DEMO_PASSWORD, remember: false });
    const mine = await api.activity.mine({ page_size: 5 });
    expect(mine.results[0].action).toBe("auth.login");
    expect(mine.next_cursor).toBeTruthy();
    const auth = await api.activity.mine({ action__startswith: "auth.", page_size: 100 });
    expect(auth.results.every((a) => a.action.startsWith("auth."))).toBe(true);
    const all = await api.activity.all({ page_size: 10 });
    expect(all.count).toBeGreaterThan(60);
    expect((await api.activity.get(all.results[0].id)).id).toBe(all.results[0].id);
  });

  it("manages webhook endpoints, tests and redeliveries", async () => {
    expect((await api.webhooks.events()).map((e) => e.name)).toContain("order.paid");
    const endpoints = await api.webhooks.endpoints();
    expect(endpoints.count).toBe(3);
    expect(endpoints.results[0].secret).toMatch(/^whsec_\*{8}.{4}$/);
    await expectError(api.webhooks.createEndpoint({ url: "http://insecure.example" }), "url_not_allowed");
    await expectError(api.webhooks.createEndpoint({ url: "https://ok.example", events: ["nope"] }), "unknown_event");
    await expectError(api.webhooks.createEndpoint({ url: "https://ok.example", events: [] }), "events_required");
    const created = await api.webhooks.createEndpoint({ url: "https://ok.example/hook", events: ["order.paid"] });
    expect(created.secret).toMatch(/^whsec_[A-Za-z0-9_]{43}$/);
    expect((await api.webhooks.updateEndpoint(created.id, { description: "Orders" })).description).toBe("Orders");
    const rotated = await api.webhooks.rotateSecret(created.id);
    expect(rotated.secret).not.toBe(created.secret);
    const test = await api.webhooks.test(created.id);
    expect(test).toMatchObject({ status: "success", status_code: 200, error: "" });
    const deliveries = await api.webhooks.deliveries(created.id);
    expect(deliveries.results[0].id).toBe(test.delivery);
    expect(deliveries.results[0]).not.toHaveProperty("payload");
    expect((await api.webhooks.delivery(test.delivery)).payload).toMatchObject({ type: "ping" });
    expect((await api.webhooks.redeliver(test.delivery)).status).toBe("success");
    const failed = (await api.webhooks.deliveries(endpoints.results.find((e) => !e.active)!.id, { status: "failed" })).results[0];
    await expectError(api.webhooks.redeliver(failed.id), "endpoint_inactive", 409);
    await api.webhooks.deleteEndpoint(created.id);
    expect((await api.webhooks.endpoints()).count).toBe(3);
  });

  it("serves rbac features, roles and permissions", async () => {
    const { features } = await api.rbac.myFeatures();
    expect(features).toContain("ai-chat");
    expect(features).toContain("new-dashboard");
    expect((await api.rbac.roles()).results.map((r) => r.name)).toEqual(["admin", "editor", "viewer"]);
    await expectError(api.rbac.createRole({ name: "admin" }), "validation_error");
    const role = await api.rbac.createRole({ name: "support", permissions: ["pleate_accounts.view_user"] });
    expect((await api.rbac.updateRole(role.id, { description: "Helps customers" })).description).toBe("Helps customers");
    expect((await api.rbac.permissions({ search: "ban" })).count).toBe(3);
    const user = (await api.staff.users({ search: "grace" })).results[0];
    expect((await api.rbac.assignRole(user.id, "support")).roles).toEqual(["editor", "support"]);
    expect((await api.rbac.removeRole(user.id, "support")).roles).toEqual(["editor"]);
    await expectError(api.rbac.assignRole(user.id, "ghost"), "unknown_role");
    await api.rbac.deleteRole(role.id);
    expect((await api.rbac.features({ enabled: true })).results.map((f) => f.key)).toEqual(["new-dashboard"]);
  });

  it("serves staff users with search, filters and ordering, stats and bans", async () => {
    const users = await api.staff.users({ page_size: 10 });
    expect(users.count).toBe(58);
    expect(users.page_count).toBe(6);
    const joined = users.results.map((u) => u.date_joined);
    expect(joined).toEqual([...joined].sort().reverse());
    const byEmail = await api.staff.users({ ordering: "email", page_size: 100 });
    const emails = byEmail.results.map((u) => u.email);
    expect(emails).toEqual([...emails].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));
    const inactive = await api.staff.users({ is_active: false, page_size: 100 });
    expect(inactive.results.every((u) => !u.is_active)).toBe(true);
    expect((await api.staff.users({ role: "admin" })).results.map((u) => u.email)).toEqual(["ada@plate.dev"]);
    const grace = (await api.staff.users({ search: "mfa@" })).results[0];
    const detail = await api.staff.user(grace.id);
    expect(detail).toMatchObject({ email: MFA_EMAIL, mfa_enabled: true, has_password: true, sessions_count: 1 });
    expect((await api.staff.updateUser(grace.id, { name: "Grace M." })).name).toBe("Grace M.");
    expect(await api.staff.revokeSessions(grace.id)).toEqual({ count: 1 });
    await expect(api.staff.sendPasswordReset(grace.id)).resolves.toBeUndefined();
    const me = await api.auth.me();
    await expectError(api.staff.updateUser(me.id, { is_staff: false }), "cannot_modify_self");
    await expectError(api.staff.deleteUser(me.id), "cannot_modify_self");
    await api.staff.deleteUser(grace.id);
    await expectError(api.staff.user(grace.id), "not_found");
    const stats = await api.staff.stats();
    expect(stats.users_total).toBe(57);
    expect(stats.signups_by_day).toHaveLength(30);
    expect((await api.staff.bans()).count).toBe(2);
    const bad = await expectError(api.staff.createBan({ network: "not a network" }), "validation_error");
    expect(bad.fields.network[0].code).toBe("invalid_network");
    const ban = await api.staff.createBan({ network: "10.0.0.0/8", reason: "Test" });
    await api.staff.deleteBan(ban.id);
    expect((await api.staff.bans()).count).toBe(2);
  });

  it("refuses staff endpoints to other users", async () => {
    await api.auth.logout();
    await expectError(api.staff.users(), "not_authenticated", 401);
    await api.auth.signup({ email: "plain@plate.dev", password: "a long password" });
    await expectError(api.staff.users(), "permission_denied", 403);
  });
});

describe("generic lists (/catalog/products)", () => {
  it("pages, searches, orders and filters 120 products", async () => {
    const first = await api.list<MockProduct>("/catalog/products", { page_size: 25 });
    expect(first).toMatchObject({ count: 120, page: 1, page_size: 25, page_count: 5 });
    expect(Object.keys(first.results[0]).sort()).toEqual(
      ["category", "created_at", "id", "name", "price", "sku", "status", "stock", "updated_at"].sort(),
    );
    const last = await api.list<MockProduct>("/catalog/products", { page_size: 25, page: 5 });
    expect(last.results).toHaveLength(20);
    const byPrice = await api.list<MockProduct>("/catalog/products", { ordering: "-price", page_size: 100 });
    const prices = byPrice.results.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
    const byName = await api.list<MockProduct>("/catalog/products", { ordering: "name", page_size: 10 });
    expect(byName.results.map((p) => p.name)).toEqual([...byName.results.map((p) => p.name)].sort((a, b) => a.localeCompare(b)));
    const plates = await api.list<MockProduct>("/catalog/products", { search: "plate", page_size: 100 });
    expect(plates.count).toBeGreaterThan(0);
    expect(plates.results.every((p) => /plate/i.test(`${p.name} ${p.sku} ${p.category}`))).toBe(true);
    const sku = first.results[3].sku;
    expect((await api.list<MockProduct>("/catalog/products", { search: sku.toLowerCase() })).results[0].sku).toBe(sku);
    const kitchen = await api.list<MockProduct>("/catalog/products", { category: "Kitchen", status: "active", page_size: 100 });
    expect(kitchen.results.every((p) => p.category === "Kitchen" && p.status === "active")).toBe(true);
    const low = await api.list<MockProduct>("/catalog/products", { low_stock: true, page_size: 100 });
    expect(low.count).toBeGreaterThan(0);
    expect(low.results.every((p) => p.stock < 10)).toBe(true);
    const notLow = await api.list<MockProduct>("/catalog/products", { low_stock: false, page_size: 100 });
    expect(low.count + notLow.count).toBe(120);
    const statuses = new Set((await api.list<MockProduct>("/catalog/products", { page_size: 100 })).results.map((p) => p.status));
    expect([...statuses].sort()).toEqual(["active", "archived", "draft"]);
    await expectError(api.list("/catalog/products", { page: 6, page_size: 25 }), "invalid_page", 404);
    await api.auth.logout();
    expect((await api.list("/catalog/products")).count).toBe(120);
  });
});
