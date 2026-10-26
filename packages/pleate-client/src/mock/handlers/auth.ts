import type { Session } from "../../api.ts";
import { DEMO_TOTP_CODE, type MockDb, type MockUser, VALID_TOKEN } from "../db.ts";
import type { Ctx, Router } from "../router.ts";
import { describeUserAgent, USER_AGENTS } from "../seed.ts";
import { fail, json, noContent, notFound, pub, validation, Validator } from "../util.ts";

const MIN_PASSWORD = 10;
const COMMON = new Set(["password123", "1234567890", "qwertyuiop", "plateplate"]);

/** Django's password validators, as the backend runs them (code `weak_password`). */
export function passwordProblems(password: string, user?: { email: string; name: string }): string[] {
  const out: string[] = [];
  if (password.length < MIN_PASSWORD) {
    out.push(`This password is too short. It must contain at least ${MIN_PASSWORD} characters.`);
  }
  if (COMMON.has(password.toLowerCase())) out.push("This password is too common.");
  if (/^\d+$/.test(password)) out.push("This password is entirely numeric.");
  const local = user?.email.split("@")[0].toLowerCase();
  if (local && local.length > 2 && password.toLowerCase().includes(local)) {
    out.push("The password is too similar to the email address.");
  }
  return out;
}

function checkPassword(field: string, password: string, user?: { email: string; name: string }) {
  const problems = passwordProblems(password, user);
  if (problems.length) throw validation({ [field]: problems.map((message) => ({ code: "weak_password", message })) });
}

export function signIn(db: MockDb, user: MockUser, request: Request, remember = false) {
  const ua = request.headers.get("User-Agent") || USER_AGENTS.chromeMac;
  const now = Date.now();
  const session = {
    id: db.random.chars(24, "0123456789abcdef"),
    ip: "203.0.113.24",
    user_agent: ua,
    ...describeUserAgent(ua),
    created_at: new Date(now).toISOString(),
    last_seen_at: new Date(now).toISOString(),
    expires_at: new Date(now + (remember ? 30 : 14) * 86_400_000).toISOString(),
    _owner: user.id,
  };
  db.sessions.unshift(session);
  db.auth = { userId: user.id, sessionId: session.id, pendingMfa: null };
  user.last_login = session.created_at;
  db.log("auth.login", user);
}

function signOut(db: MockDb) {
  if (db.auth.sessionId) db.sessions = db.sessions.filter((s) => s.id !== db.auth.sessionId);
  db.auth = { userId: null, sessionId: null, pendingMfa: null };
}

function backupCodes(db: MockDb): string[] {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => `${db.random.chars(4, alphabet)}-${db.random.chars(4, alphabet)}`);
}

/** Checks a TOTP (always "123456" in the mock) or, when allowed, a backup code. */
function codeOk(user: MockUser, code: string, allowBackup = true): boolean {
  const clean = code.replace(/\s/g, "");
  if (clean === DEMO_TOTP_CODE) return true;
  return allowBackup && user.mfa.backup_codes.includes(clean.toLowerCase());
}

function qrSvg(text: string): string {
  // Not a real QR code: a deterministic 21x21 pattern with the three finder squares.
  let hash = 0;
  for (const ch of text) hash = (hash * 33 + ch.charCodeAt(0)) >>> 0;
  const cells: string[] = [];
  const finder = (x: number, y: number) =>
    `<path d="M${x} ${y}h7v7h-7z M${x + 1} ${y + 1}v5h5v-5z" fill-rule="evenodd"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const inFinder = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
      if (inFinder) continue;
      hash = (Math.imul(hash, 1103515245) + 12345) >>> 0;
      if ((hash >>> 16) & 1) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 25 25" width="200" height="200" shape-rendering="crispEdges"><rect x="-2" y="-2" width="25" height="25" fill="#fff"/><g fill="#000">${finder(0, 0)}${finder(14, 0)}${finder(0, 14)}${cells.join("")}</g></svg>`;
}

function sessionsOf(ctx: Ctx): Session[] {
  const now = Date.now();
  return ctx.db.sessions
    .filter((s) => s._owner === ctx.user.id && new Date(s.expires_at).getTime() > now)
    .sort((a, b) => b.last_seen_at.localeCompare(a.last_seen_at))
    .map((s) => ({ ...pub(s), current: s.id === ctx.db.auth.sessionId }));
}

export function authRoutes(r: Router) {
  r.get("/csrf", ({ db }) => json({ csrf_token: `mock-${db.random.chars(32)}` }), "public");
  r.get("/health", () => json({ status: "ok", checks: { mongodb: "ok" } }), "public");

  r.post(
    "/auth/signup",
    async ({ db, request, body }) => {
      const data = await body();
      const v = new Validator(data);
      const email = v.email("email");
      const password = v.required("password");
      if (email && db.users.some((u) => u.email === email)) {
        v.add("email", "email_taken", "An account with this email already exists.");
      }
      const locale = v.optional("locale");
      if (locale && !["en", "it", "es"].includes(locale)) v.add("locale", "invalid_choice", `"${locale}" is not a valid choice.`);
      v.throwIfAny();
      const name = String(data.name ?? "").slice(0, 150);
      checkPassword("password", password!, { email: email!, name });
      const required = db.options.requireEmailVerification;
      const user: MockUser = {
        id: db.id(),
        email: email!,
        name,
        password: password!,
        email_verified: false,
        locale: (locale as MockUser["locale"]) ?? "en",
        timezone: "",
        preferences: {},
        avatar: null,
        is_staff: false,
        is_superuser: false,
        is_active: true,
        date_joined: new Date().toISOString(),
        last_login: null,
        roles: db.roles.filter((role) => role.is_default).map((role) => role.name),
        mfa: { enabled: false, confirmed_at: null, pending_secret: null, backup_codes: [] },
      };
      db.users.push(user);
      db.log("auth.signup", user);
      if (!required) signIn(db, user, request);
      return json({ user: db.me(user), verification_required: required }, 201);
    },
    "public",
  );

  r.post(
    "/auth/login",
    async ({ db, request, body }) => {
      const data = await body();
      const v = new Validator(data);
      const email = v.email("email");
      const password = v.required("password");
      v.throwIfAny();
      const user = db.users.find((u) => u.email === email);
      if (!user || !user.is_active || user.password === null || user.password !== password) {
        db.log("auth.login_failed", null, undefined, { metadata: { email } });
        throw fail(400, "invalid_credentials", "Email or password is wrong.");
      }
      if (db.options.requireEmailVerification && !user.email_verified) {
        throw fail(403, "email_not_verified", "Confirm your email before signing in.");
      }
      const remember = data.remember === true || data.remember === "true";
      if (user.mfa.enabled) {
        db.auth.pendingMfa = { userId: user.id, remember, attempts: 0 };
        return json({ mfa_required: true, methods: ["totp", "backup_code"] });
      }
      signIn(db, user, request, remember);
      return json({ user: db.me(user), mfa_required: false });
    },
    "public",
  );

  r.post(
    "/auth/logout",
    ({ db }) => {
      const user = db.currentUser();
      if (user) db.log("auth.logout", user);
      signOut(db);
      return noContent();
    },
    "public",
  );

  r.get("/auth/me", ({ db, user }) => json(db.me(user)));
  r.patch("/auth/me", async ({ db, user, body }) => {
    const data = await body();
    const v = new Validator(data);
    if (data.locale !== undefined && !["", "en", "it", "es"].includes(String(data.locale))) {
      v.add("locale", "invalid_choice", `"${data.locale}" is not a valid choice.`);
    }
    if (data.preferences !== undefined && (typeof data.preferences !== "object" || data.preferences === null || Array.isArray(data.preferences))) {
      v.add("preferences", "invalid", "Preferences must be a small object.");
    }
    if (data.name !== undefined && String(data.name).length > 150) {
      v.add("name", "max_length", "Ensure this field has no more than 150 characters.");
    }
    v.throwIfAny();
    if (data.name !== undefined) user.name = String(data.name);
    if (data.locale !== undefined) user.locale = data.locale as MockUser["locale"];
    if (data.timezone !== undefined) user.timezone = String(data.timezone);
    if (data.preferences !== undefined) user.preferences = { ...user.preferences, ...(data.preferences as object) };
    return json(db.me(user));
  });
  r.delete("/auth/me", async ({ db, user, body }) => {
    const data = await body();
    if (user.password !== null) {
      if (data.password !== user.password) throw fail(400, "wrong_password", "The password is wrong.");
    } else if (String(data.confirm_email ?? "").toLowerCase() !== user.email) {
      throw fail(400, "confirmation_required", "Type your email to confirm.");
    }
    db.log("account.deleted", user);
    db.sessions = db.sessions.filter((s) => s._owner !== user.id);
    db.users = db.users.filter((u) => u.id !== user.id);
    db.auth = { userId: null, sessionId: null, pendingMfa: null };
    return noContent();
  });
  r.get("/auth/me/export", ({ db, user }) =>
    json(
      {
        account: db.me(user),
        exported_at: new Date().toISOString(),
        sessions: db.sessions.filter((s) => s._owner === user.id).map(pub),
        api_keys: db.apiKeys.filter((k) => k._owner === user.id).map(pub),
        files: db.files.filter((f) => f._owner === user.id).map((f) => ({ ...pub(f), _bytes: undefined })),
        notifications: db.notifications.filter((n) => n._owner === user.id).map(pub),
        activity: db.activity.filter((a) => a.actor === user.id),
      },
      200,
      { "Content-Disposition": 'attachment; filename="account-export.json"' },
    ),
  );

  r.put("/auth/me/avatar", async ({ db, user, request }) => {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") throw fail(400, "file_required", "Choose an image.");
    if (file.size > 5 * 1024 * 1024) throw fail(413, "file_too_large", "The image is too large.", { max_size: 5 * 1024 * 1024 });
    if (file.type && !file.type.startsWith("image/")) throw fail(400, "invalid_image", "This file is not a valid image.");
    user.avatar = {
      bytes: new Uint8Array(await file.arrayBuffer()),
      type: file.type || "image/png",
      version: db.random.chars(8),
    };
    return json(db.me(user));
  });
  r.delete("/auth/me/avatar", ({ db, user }) => {
    user.avatar = null;
    return json(db.me(user));
  });
  r.get("/auth/avatar/:userId", ({ db, params }) => {
    const owner = db.user(params.userId);
    if (!owner?.avatar) throw notFound();
    return new Response(owner.avatar.bytes.slice().buffer as ArrayBuffer, {
      headers: { "Content-Type": owner.avatar.type, "Cache-Control": "private, max-age=86400" },
    });
  });

  r.post("/auth/password/change", async ({ db, user, body }) => {
    const data = await body();
    if (user.password !== null && data.current_password !== user.password) {
      throw validation({ current_password: { code: "wrong_password", message: "The current password is wrong." } });
    }
    const v = new Validator(data);
    const next = v.required("new_password");
    v.throwIfAny();
    checkPassword("new_password", next!, user);
    user.password = next!;
    db.sessions = db.sessions.filter((s) => s._owner !== user.id || s.id === db.auth.sessionId);
    db.log("auth.password_changed", user);
    return noContent();
  });

  r.post(
    "/auth/password/reset",
    async ({ body }) => {
      const v = new Validator(await body());
      v.email("email");
      v.throwIfAny();
      return noContent(202);
    },
    "public",
  );
  r.post(
    "/auth/password/reset/validate",
    async ({ body }) => {
      const v = new Validator(await body());
      const token = v.required("token");
      v.throwIfAny();
      return json({ valid: token === VALID_TOKEN });
    },
    "public",
  );
  r.post(
    "/auth/password/reset/confirm",
    async ({ db, body }) => {
      const data = await body();
      const v = new Validator(data);
      const token = v.required("token");
      const password = v.required("new_password");
      v.throwIfAny();
      if (token !== VALID_TOKEN) throw fail(400, "invalid_token", "This link is not valid anymore. Ask for a new one.");
      const user = db.users.find((u) => u.email === "ada@plate.dev") ?? db.users[0];
      checkPassword("new_password", password!, user);
      user.password = password!;
      user.email_verified = true;
      db.sessions = db.sessions.filter((s) => s._owner !== user.id);
      if (db.auth.userId === user.id) db.auth = { userId: null, sessionId: null, pendingMfa: null };
      db.log("auth.password_reset", user);
      return noContent();
    },
    "public",
  );

  r.post(
    "/auth/email/verify",
    async ({ db, body }) => {
      const v = new Validator(await body());
      const token = v.required("token");
      v.throwIfAny();
      if (token !== VALID_TOKEN) throw fail(400, "invalid_token", "This link is not valid anymore. Ask for a new one.");
      const user = db.currentUser() ?? db.users[0];
      if (!user.email_verified) {
        user.email_verified = true;
        db.log("auth.email_verified", user);
      }
      return json(db.me(user));
    },
    "public",
  );
  r.post("/auth/email/verify/resend", () => noContent(202));
  r.post("/auth/email/change", async ({ db, user, body }) => {
    const data = await body();
    const v = new Validator(data);
    const email = v.email("new_email");
    if (email && db.users.some((u) => u.email === email)) {
      v.add("new_email", "email_taken", "An account with this email already exists.");
    }
    if (user.password !== null && data.password !== user.password) {
      v.add("password", "wrong_password", "The password is wrong.");
    }
    v.throwIfAny();
    return noContent(202);
  });
  r.post(
    "/auth/email/change/confirm",
    async ({ db, body }) => {
      const v = new Validator(await body());
      const token = v.required("token");
      v.throwIfAny();
      const user = db.currentUser();
      if (token !== VALID_TOKEN || !user) {
        throw fail(400, "invalid_token", "This link is not valid anymore. Ask for a new one.");
      }
      user.email_verified = true;
      return json(db.me(user));
    },
    "public",
  );

  // Sessions
  r.get("/auth/sessions", (ctx) => json(sessionsOf(ctx)));
  r.delete("/auth/sessions/:id", ({ db, user, params }) => {
    const row = db.sessions.find((s) => s._owner === user.id && s.id === params.id);
    if (!row) throw notFound();
    if (row.id === db.auth.sessionId) signOut(db);
    else db.sessions = db.sessions.filter((s) => s !== row);
    db.log("auth.sessions_revoked", user);
    return noContent();
  });
  r.post("/auth/sessions/revoke-others", ({ db, user }) => {
    const before = db.sessions.length;
    db.sessions = db.sessions.filter((s) => s._owner !== user.id || s.id === db.auth.sessionId);
    const count = before - db.sessions.length;
    db.log("auth.sessions_revoked", user, undefined, { metadata: { count } });
    return json({ count });
  });

  // Two factor authentication
  r.get("/auth/mfa", ({ user }) =>
    json({
      enabled: user.mfa.enabled,
      confirmed_at: user.mfa.confirmed_at,
      backup_codes_remaining: user.mfa.enabled ? user.mfa.backup_codes.length : 0,
    }),
  );
  r.post("/auth/mfa/setup", ({ db, user }) => {
    if (user.mfa.enabled) throw fail(409, "mfa_already_enabled", "Two factor authentication is already enabled.");
    const secret = db.random.chars(32, "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567");
    user.mfa.pending_secret = secret;
    const otpauth = `otpauth://totp/Plate:${encodeURIComponent(user.email)}?secret=${secret}&issuer=Plate`;
    return json({ secret, otpauth_url: otpauth, qr_svg: qrSvg(otpauth) });
  });
  r.post("/auth/mfa/confirm", async ({ db, user, body }) => {
    const v = new Validator(await body());
    const code = v.required("code");
    v.throwIfAny();
    if (user.mfa.enabled) throw fail(409, "mfa_already_enabled", "Two factor authentication is already enabled.");
    if (!user.mfa.pending_secret) throw fail(400, "mfa_setup_required", "Start the setup first.");
    if (!codeOk(user, code!, false)) throw fail(400, "invalid_code", "The code is not valid.");
    user.mfa = { enabled: true, confirmed_at: new Date().toISOString(), pending_secret: null, backup_codes: backupCodes(db) };
    db.log("mfa.enabled", user);
    return json({ backup_codes: [...user.mfa.backup_codes] });
  });
  r.post("/auth/mfa/disable", async ({ db, user, body }) => {
    const data = await body();
    if (!user.mfa.enabled) throw fail(400, "mfa_not_enabled", "Two factor authentication is not enabled.");
    if (user.password !== null && data.password !== user.password) throw fail(400, "wrong_password", "The password is wrong.");
    if (!codeOk(user, String(data.code ?? ""))) throw fail(400, "invalid_code", "The code is not valid.");
    user.mfa = { enabled: false, confirmed_at: null, pending_secret: null, backup_codes: [] };
    db.log("mfa.disabled", user);
    return noContent();
  });
  r.post("/auth/mfa/backup-codes", async ({ db, user, body }) => {
    const data = await body();
    if (!user.mfa.enabled) throw fail(400, "mfa_not_enabled", "Two factor authentication is not enabled.");
    if (!codeOk(user, String(data.code ?? ""), false)) throw fail(400, "invalid_code", "The code is not valid.");
    user.mfa.backup_codes = backupCodes(db);
    return json({ backup_codes: [...user.mfa.backup_codes] });
  });
  r.post(
    "/auth/mfa/verify",
    async ({ db, request, body }) => {
      const data = await body();
      const code = String(data.code ?? "").trim();
      const backup = String(data.backup_code ?? "").trim();
      if (!code && !backup) throw fail(400, "code_required", "Type the code from your app or a backup code.");
      const pending = db.auth.pendingMfa;
      const user = pending && db.user(pending.userId);
      if (!pending || !user || !user.mfa.enabled) {
        db.auth.pendingMfa = null;
        throw fail(400, "mfa_pending_expired", "The sign in expired. Sign in again.");
      }
      const ok = code ? code.replace(/\s/g, "") === DEMO_TOTP_CODE : user.mfa.backup_codes.includes(backup.toLowerCase());
      if (!ok) {
        pending.attempts += 1;
        const left = Math.max(0, 5 - pending.attempts);
        if (!left) db.auth.pendingMfa = null;
        throw fail(400, "invalid_code", "The code is not valid.", { attempts_left: left });
      }
      if (backup) db.log("mfa.backup_code_used", user);
      signIn(db, user, request, pending.remember);
      return json({ user: db.me(user), mfa_required: false });
    },
    "public",
  );

  // OAuth
  const providers = [
    { id: "google", name: "Google" },
    { id: "github", name: "GitHub" },
  ];
  r.get("/auth/oauth/providers", () => json(providers), "public");
  r.get(
    "/auth/oauth/:provider/start",
    ({ db, params, url, request }) => {
      if (!providers.some((p) => p.id === params.provider)) {
        throw fail(404, "oauth_unknown_provider", "This sign in method is not available.");
      }
      const mode = url.searchParams.get("mode") ?? "login";
      if (!["login", "link"].includes(mode)) throw fail(400, "invalid_mode", "Unknown mode.");
      const next = (url.searchParams.get("next") ?? "/").startsWith("/") ? (url.searchParams.get("next") ?? "/") : "/";
      const ada = db.users.find((u) => u.email === "ada@plate.dev") ?? db.users[0];
      if (mode === "link") {
        const user = db.currentUser();
        if (!user) throw fail(401, "not_authenticated", "Authentication credentials were not provided.");
        if (!db.socialAccounts.some((a) => a._owner === user.id && a.provider === params.provider)) {
          db.socialAccounts.push({
            id: db.id(),
            provider: params.provider,
            email: user.email,
            created_at: new Date().toISOString(),
            last_login_at: null,
            _owner: user.id,
          });
        }
      } else {
        signIn(db, ada, request, url.searchParams.get("remember") === "1");
      }
      return new Response(null, {
        status: 302,
        headers: { Location: `/oauth/done?status=ok&next=${encodeURIComponent(next)}` },
      });
    },
    "public",
  );
  r.get("/auth/oauth/accounts", ({ db, user }) =>
    json(db.socialAccounts.filter((a) => a._owner === user.id).map(pub)),
  );
  r.delete("/auth/oauth/accounts/:id", ({ db, user, params }) => {
    const account = db.socialAccounts.find((a) => a._owner === user.id && a.id === params.id);
    if (!account) throw notFound();
    const others = db.socialAccounts.filter((a) => a._owner === user.id && a !== account);
    if (user.password === null && !others.length) {
      throw fail(400, "last_login_method", "Set a password before unlinking your last sign in method.");
    }
    db.socialAccounts = db.socialAccounts.filter((a) => a !== account);
    db.log("oauth.unlinked", user);
    return noContent();
  });
}
