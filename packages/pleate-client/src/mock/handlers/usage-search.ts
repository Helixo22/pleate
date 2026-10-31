import type { SearchResult, UsageSummary } from "../../api.ts";
import type { Router } from "../router.ts";
import { json, validation } from "../util.ts";
import { plansPayload } from "./commerce.ts";

const TYPES = ["files", "conversations", "notifications"] as const;

/** search.services._safe_link */
function safeLink(url: string): string | null {
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) return url;
  return /^https?:\/\//i.test(url) ? url : null;
}

export function usageAndSearchRoutes(r: Router) {
  r.get("/usage", ({ db, user }) => {
    const ai = db.aiUsage[user.id] ?? { input_tokens: 0, output_tokens: 0 };
    const now = Date.now();
    const summary: UsageSummary = {
      plan: plansPayload(db, user).current_plan ?? null,
      items: [
        {
          id: "storage",
          label: "Storage",
          used: db.files.filter((f) => f._owner === user.id).reduce((sum, f) => sum + f.size, 0),
          limit: 500 * 1024 * 1024,
          unit: "bytes",
        },
        { id: "ai_tokens", label: "AI tokens today", used: ai.input_tokens + ai.output_tokens, limit: 200_000, unit: "tokens" },
        {
          id: "api_keys",
          label: "API keys",
          used: db.apiKeys.filter(
            (k) => k._owner === user.id && !k.revoked_at && (!k.expires_at || new Date(k.expires_at).getTime() > now),
          ).length,
          limit: 25,
          unit: "keys",
        },
        { id: "webhooks", label: "Webhook endpoints", used: db.endpoints.filter((e) => e._owner === user.id).length, limit: 20, unit: "endpoints" },
      ],
    };
    return json(summary);
  });

  r.get("/search", ({ db, user, url }) => {
    const q = url.searchParams.get("q") ?? "";
    const rawTypes = url.searchParams.get("types");
    const rawLimit = url.searchParams.get("limit");
    const errors: Record<string, { code: string; message: string }> = {};
    if (q.length < 2) errors.q = { code: "min_length", message: "Ensure this field has at least 2 characters." };
    if (q.length > 100) errors.q = { code: "max_length", message: "Ensure this field has no more than 100 characters." };
    const types = rawTypes ? [...new Set(rawTypes.split(",").map((t) => t.trim()).filter(Boolean))] : [...TYPES];
    const unknown = types.find((t) => !(TYPES as readonly string[]).includes(t));
    if (unknown || !types.length) errors.types = { code: "invalid_type", message: `Unknown type: ${unknown ?? rawTypes}.` };
    const limit = rawLimit === null ? 5 : Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
      errors.limit = { code: "max_value", message: "Ensure this value is between 1 and 10." };
    }
    if (Object.keys(errors).length) throw validation(errors);

    const needle = q.toLowerCase();
    const hit = (text: string) => text.toLowerCase().includes(needle);
    const newest = <T extends { created_at: string }>(a: T, b: T) => b.created_at.localeCompare(a.created_at);
    const results: SearchResult[] = [];
    for (const type of types) {
      if (type === "files") {
        db.files
          .filter((f) => f._owner === user.id && f.status === "ready" && hit(f.name))
          .sort(newest)
          .slice(0, limit)
          .forEach((f) => results.push({ type, id: f.id, title: f.name, subtitle: f.content_type, url: `/files/${f.id}` }));
      } else if (type === "conversations") {
        db.conversations
          .filter((c) => c._owner === user.id && hit(c.title ?? ""))
          .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at))
          .slice(0, limit)
          .forEach((c) => results.push({ type, id: c.id, title: c.title ?? "", subtitle: null, url: `/chat/${c.id}` }));
      } else {
        db.notifications
          .filter((n) => n._owner === user.id && hit(n.title))
          .sort(newest)
          .slice(0, limit)
          .forEach((n) =>
            results.push({ type: "notifications", id: n.id, title: n.title, subtitle: n.body.slice(0, 120) || null, url: safeLink(n.url) ?? "/notifications" }),
          );
      }
    }
    return json(results);
  });
}
