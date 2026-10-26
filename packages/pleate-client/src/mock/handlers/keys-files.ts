import type { FileItem } from "../../api.ts";
import type { MockApiKey, MockFile } from "../db.ts";
import type { Ctx, Router } from "../router.ts";
import { fail, json, noContent, notFound, page, pub, query, Validator } from "../util.ts";

const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const SECRET_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const QUOTA = 500 * 1024 * 1024;

function keyStatus(key: MockApiKey): MockApiKey["status"] {
  if (key.revoked_at) return "revoked";
  if (key.expires_at && new Date(key.expires_at).getTime() <= Date.now()) return "expired";
  return "active";
}

function publicKey(key: MockApiKey) {
  return { ...pub(key), status: keyStatus(key) };
}

function ownKey(ctx: Ctx): MockApiKey {
  const key = ctx.db.apiKeys.find((k) => k._owner === ctx.user.id && k.id === ctx.params.id);
  if (!key) throw notFound();
  return key;
}

export function fileOut(ctx: Ctx, file: MockFile): FileItem {
  return { ...pub(file), download_url: `${ctx.options.baseUrl.replace(/\/$/, "")}/files/${file.id}/download` };
}

function ownFile(ctx: Ctx): MockFile {
  const file = ctx.db.files.find((f) => f._owner === ctx.user.id && f.id === ctx.params.id && f.status === "ready");
  if (!file) throw notFound();
  return file;
}

function sniff(name: string, type: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["txt", "md", "log"].includes(ext)) return "text/plain";
  if (ext === "csv") return "text/csv";
  return type || "application/octet-stream";
}

export function keyAndFileRoutes(r: Router) {
  // API keys
  r.get("/api-keys", (ctx) => {
    const rows = query(
      ctx.db.apiKeys.filter((k) => k._owner === ctx.user.id),
      ctx.url,
      { search: ["name", "prefix"], ordering: ["created_at", "name", "last_used_at", "expires_at"], defaultOrdering: "-created_at" },
    );
    return json(page(rows, ctx.url, publicKey));
  });
  r.post("/api-keys", async ({ db, user, body }) => {
    const data = await body();
    const v = new Validator(data);
    const name = v.required("name");
    if (name && name.length > 100) v.add("name", "max_length", "Ensure this field has no more than 100 characters.");
    const scopes = (Array.isArray(data.scopes) ? data.scopes : ["read"]).map(String);
    for (const scope of scopes) {
      if (!["read", "write"].includes(scope)) v.add("scopes", "invalid_choice", `"${scope}" is not a valid choice.`);
    }
    const days = data.expires_in_days;
    if (days !== undefined && days !== null && (!Number.isInteger(days) || (days as number) < 1 || (days as number) > 3650)) {
      v.add("expires_in_days", "invalid", "Choose between 1 and 3650 days.");
    }
    v.throwIfAny();
    if (db.apiKeys.filter((k) => k._owner === user.id && keyStatus(k) === "active").length >= 25) {
      throw fail(400, "api_key_limit", "You can have up to 25 active keys. Revoke one first.");
    }
    const prefix = db.random.chars(8, KEY_ALPHABET);
    const key: MockApiKey = {
      id: db.id(),
      name: name!,
      prefix,
      display: `pl_${prefix}_...`,
      scopes: scopes.includes("write") ? ["read", "write"] : ["read"],
      status: "active",
      expires_at: days ? new Date(Date.now() + (days as number) * 86_400_000).toISOString() : null,
      last_used_at: null,
      last_used_ip: "",
      created_at: new Date().toISOString(),
      revoked_at: null,
      _owner: user.id,
    };
    db.apiKeys.unshift(key);
    db.log("apikeys.apikey.created", user, { type: "apikeys.apikey", id: key.id, repr: key.name });
    return json({ ...publicKey(key), key: `pl_${prefix}_${db.random.chars(43, SECRET_ALPHABET)}` }, 201);
  });
  r.get("/api-keys/:id", (ctx) => json(publicKey(ownKey(ctx))));
  r.patch("/api-keys/:id", async (ctx) => {
    const key = ownKey(ctx);
    const data = await ctx.body();
    if (data.name !== undefined) {
      const v = new Validator(data);
      const name = v.required("name");
      v.throwIfAny();
      key.name = name!;
    }
    return json(publicKey(key));
  });
  r.delete("/api-keys/:id", (ctx) => {
    const key = ownKey(ctx);
    key.revoked_at ??= new Date().toISOString();
    key.status = "revoked";
    return noContent();
  });

  // Files
  r.get("/files", (ctx) => {
    const rows = query(
      ctx.db.files.filter((f) => f._owner === ctx.user.id && f.status === "ready"),
      ctx.url,
      {
        search: ["name"],
        ordering: ["created_at", "size", "name"],
        defaultOrdering: "-created_at",
        filters: {
          content_type: (f, v) => f.content_type === v,
          purpose: (f, v) => f.purpose === v,
        },
      },
    );
    return json(page(rows, ctx.url, (f) => fileOut(ctx, f)));
  });
  r.post("/files", async (ctx) => {
    const { db, user, request } = ctx;
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw fail(415, "unsupported_media_type", "Unsupported media type in request.");
    }
    const upload = form.get("file");
    if (!upload || typeof upload === "string") {
      const v = new Validator({});
      v.add("file", "required", "Choose a file.");
      v.throwIfAny();
    }
    const blob = upload as File;
    if (blob.size > MAX_FILE_SIZE) {
      throw fail(413, "file_too_large", "This file is too large.", { max_size: MAX_FILE_SIZE });
    }
    const used = db.files.filter((f) => f._owner === user.id).reduce((sum, f) => sum + f.size, 0);
    if (used + blob.size > QUOTA) {
      throw fail(413, "quota_exceeded", "You are out of storage space.", { quota: QUOTA, used });
    }
    const name = (blob.name || "upload").replace(/[\\/]/g, "_").replace(/[\u0000-\u001f]/g, "").slice(0, 200);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const isImage = blob.type.startsWith("image/");
    const file: MockFile = {
      id: db.id(),
      name,
      size: blob.size,
      content_type: sniff(name, blob.type),
      checksum: db.random.chars(64, "0123456789abcdef"),
      width: isImage ? 1200 : null,
      height: isImage ? 800 : null,
      purpose: String(form.get("purpose") ?? "").slice(0, 32),
      status: "ready",
      created_at: new Date().toISOString(),
      download_url: "",
      _owner: user.id,
      _bytes: bytes,
    };
    db.files.unshift(file);
    return json(fileOut(ctx, file), 201);
  });
  r.get("/files/usage", ({ db, user }) => {
    const mine = db.files.filter((f) => f._owner === user.id && f.status === "ready");
    return json({ used: mine.reduce((sum, f) => sum + f.size, 0), quota: QUOTA, count: mine.length });
  });
  r.post("/files/presign", () => {
    throw fail(400, "presign_not_supported", "Direct uploads are not enabled.");
  });
  r.get("/files/:id", (ctx) => json(fileOut(ctx, ownFile(ctx))));
  r.patch("/files/:id", async (ctx) => {
    const file = ownFile(ctx);
    const v = new Validator(await ctx.body());
    const name = v.required("name");
    v.throwIfAny();
    file.name = name!.replace(/[\\/]/g, "_").slice(0, 200);
    return json(fileOut(ctx, file));
  });
  r.delete("/files/:id", (ctx) => {
    const file = ownFile(ctx);
    ctx.db.files = ctx.db.files.filter((f) => f !== file);
    return noContent();
  });
  r.get("/files/:id/download", (ctx) => {
    const file = ownFile(ctx);
    const inline = ctx.url.searchParams.get("inline") === "1" && /^(image\/|application\/pdf)/.test(file.content_type);
    return new Response(file._bytes.slice().buffer as ArrayBuffer, {
      headers: {
        "Content-Type": file.content_type,
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
  r.post("/files/:id/complete", () => {
    throw fail(400, "upload_not_found", "The upload was not found.");
  });
}
