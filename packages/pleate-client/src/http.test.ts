import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ApiError, isApiError } from "./errors.ts";
import { Http } from "./http.ts";

const BASE = "http://localhost/api";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function csrfEndpoint(tokens: string[] = ["tok-1", "tok-2", "tok-3"]) {
  let calls = 0;
  server.use(
    http.get(`${BASE}/csrf`, () => {
      const token = tokens[Math.min(calls, tokens.length - 1)];
      calls += 1;
      return HttpResponse.json({ csrf_token: token });
    }),
  );
  return () => calls;
}

describe("Http", () => {
  it("GETs JSON with the default headers and a clean query string", async () => {
    let seen: Request | undefined;
    server.use(
      http.get(`${BASE}/things`, ({ request }) => {
        seen = request;
        return HttpResponse.json({ ok: true });
      }),
    );
    const client = new Http({ baseUrl: `${BASE}/`, locale: "it", headers: () => ({ "X-Extra": "1" }) });
    const data = await client.get<{ ok: boolean }>("/things", {
      page: 2,
      search: "",
      ordering: "-price",
      status: undefined,
      low_stock: true,
      tags: ["a", "b"],
    });
    expect(data).toEqual({ ok: true });
    const url = new URL(seen!.url);
    expect(url.pathname).toBe("/api/things");
    expect(url.search).toBe("?page=2&ordering=-price&low_stock=true&tags=a&tags=b");
    expect(seen!.headers.get("Accept")).toBe("application/json");
    expect(seen!.headers.get("Accept-Language")).toBe("it");
    expect(seen!.headers.get("X-Extra")).toBe("1");
  });

  it("builds absolute URLs for links", () => {
    const client = new Http({ baseUrl: BASE });
    expect(client.url("files/1/download", { inline: 1, x: undefined })).toBe(`${BASE}/files/1/download?inline=1`);
    expect(new Http().url("/auth/me")).toBe("/api/auth/me");
  });

  it("returns undefined for 204 and empty bodies, text for non JSON", async () => {
    csrfEndpoint();
    server.use(
      http.delete(`${BASE}/things/1`, () => new HttpResponse(null, { status: 204 })),
      http.post(`${BASE}/empty`, () => new HttpResponse("", { status: 202 })),
      http.get(`${BASE}/text`, () => HttpResponse.text("hello")),
    );
    const client = new Http({ baseUrl: BASE });
    await expect(client.delete("/things/1")).resolves.toBeUndefined();
    await expect(client.post("/empty")).resolves.toBeUndefined();
    await expect(client.get("/text")).resolves.toBe("hello");
  });

  it("turns error bodies into ApiError with fields and fieldErrors()", async () => {
    csrfEndpoint();
    server.use(
      http.post(`${BASE}/auth/signup`, () =>
        HttpResponse.json(
          {
            error: {
              status: 400,
              code: "validation_error",
              message: "Some fields are not valid.",
              fields: {
                email: [{ code: "email_taken", message: "An account with this email already exists." }],
                password: [
                  { code: "weak_password", message: "Too short." },
                  { code: "weak_password", message: "Too common." },
                ],
              },
            },
          },
          { status: 400 },
        ),
      ),
    );
    const client = new Http({ baseUrl: BASE });
    const error = (await client.post("/auth/signup", { email: "x" }).catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(isApiError(error, "validation_error")).toBe(true);
    expect(isApiError(error, "other")).toBe(false);
    expect(error.status).toBe(400);
    expect(error.message).toBe("Some fields are not valid.");
    expect(error.fields.email[0].code).toBe("email_taken");
    expect(error.fieldErrors()).toEqual({ email: "An account with this email already exists.", password: "Too short." });
  });

  it("reads retry_after, falls back to http_error for non JSON errors and calls onUnauthorized", async () => {
    server.use(
      http.get(`${BASE}/limited`, () =>
        HttpResponse.json({ error: { status: 429, code: "throttled", message: "Slow down.", retry_after: 12 } }, { status: 429 }),
      ),
      http.get(`${BASE}/broken`, () => new HttpResponse("<h1>Bad gateway</h1>", { status: 502, statusText: "Bad Gateway" })),
      http.get(`${BASE}/auth/me`, () =>
        HttpResponse.json({ error: { status: 401, code: "not_authenticated", message: "Sign in." } }, { status: 401 }),
      ),
    );
    const onUnauthorized = vi.fn();
    const client = new Http({ baseUrl: BASE, onUnauthorized });
    const limited = (await client.get("/limited").catch((e) => e)) as ApiError;
    expect(limited.code).toBe("throttled");
    expect(limited.retryAfter).toBe(12);
    const broken = (await client.get("/broken").catch((e) => e)) as ApiError;
    expect(broken).toMatchObject({ status: 502, code: "http_error", message: "Bad Gateway" });
    expect(broken.retryAfter).toBeUndefined();
    await expect(client.get("/auth/me")).rejects.toMatchObject({ code: "not_authenticated" });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(onUnauthorized.mock.calls[0][0]).toBeInstanceOf(ApiError);
  });

  it("fetches a CSRF token once and sends it on unsafe requests only", async () => {
    const csrfCalls = csrfEndpoint(["tok-1"]);
    const seen: Record<string, string | null> = {};
    server.use(
      http.get(`${BASE}/safe`, ({ request }) => {
        seen.get = request.headers.get("X-CSRFToken");
        return HttpResponse.json({});
      }),
      http.all(`${BASE}/unsafe`, async ({ request }) => {
        seen[request.method] = request.headers.get("X-CSRFToken");
        seen.type = request.headers.get("Content-Type");
        seen.body = await request.text();
        return HttpResponse.json({});
      }),
    );
    const client = new Http({ baseUrl: BASE });
    await client.get("/safe");
    expect(csrfCalls()).toBe(0);
    await Promise.all([client.post("/unsafe", { a: 1 }), client.put("/unsafe", { a: 1 }), client.patch("/unsafe", { a: 1 })]);
    await client.delete("/unsafe");
    expect(csrfCalls()).toBe(1);
    expect(seen).toMatchObject({ get: null, POST: "tok-1", PUT: "tok-1", PATCH: "tok-1", DELETE: "tok-1" });
    expect(seen.type).toBeNull();
    expect(seen.body).toBe("");
  });

  it("refreshes the token and retries once on csrf_failed", async () => {
    const csrfCalls = csrfEndpoint(["old", "new"]);
    const tokens: (string | null)[] = [];
    server.use(
      http.post(`${BASE}/login`, ({ request }) => {
        const token = request.headers.get("X-CSRFToken");
        tokens.push(token);
        if (token !== "new") {
          return HttpResponse.json({ error: { status: 403, code: "csrf_failed", message: "CSRF failed." } }, { status: 403 });
        }
        return HttpResponse.json({ ok: true });
      }),
    );
    const client = new Http({ baseUrl: BASE });
    await expect(client.post("/login", {})).resolves.toEqual({ ok: true });
    expect(tokens).toEqual(["old", "new"]);
    expect(csrfCalls()).toBe(2);
  });

  it("retries a csrf_failed request only once", async () => {
    csrfEndpoint(["a", "b", "c"]);
    let calls = 0;
    server.use(
      http.post(`${BASE}/login`, () => {
        calls += 1;
        return HttpResponse.json({ error: { status: 403, code: "csrf_failed", message: "CSRF failed." } }, { status: 403 });
      }),
      http.post(`${BASE}/forbidden`, () => {
        calls += 1;
        return HttpResponse.json({ error: { status: 403, code: "permission_denied", message: "No." } }, { status: 403 });
      }),
    );
    const client = new Http({ baseUrl: BASE });
    await expect(client.post("/login", {})).rejects.toMatchObject({ code: "csrf_failed", status: 403 });
    expect(calls).toBe(2);
    calls = 0;
    await expect(client.post("/forbidden", {})).rejects.toMatchObject({ code: "permission_denied" });
    expect(calls).toBe(1);
  });

  it("skips CSRF entirely with csrf: false and honors a custom header name", async () => {
    const csrfCalls = csrfEndpoint(["custom"]);
    const headers: Record<string, string | null> = {};
    server.use(
      http.post(`${BASE}/x`, ({ request }) => {
        headers.default = request.headers.get("X-CSRFToken");
        headers.custom = request.headers.get("X-Custom-Csrf");
        return HttpResponse.json({});
      }),
    );
    await new Http({ baseUrl: BASE, csrf: false }).post("/x");
    expect(csrfCalls()).toBe(0);
    expect(headers).toEqual({ default: null, custom: null });
    await new Http({ baseUrl: BASE, csrf: { headerName: "X-Custom-Csrf" } }).post("/x");
    expect(headers).toEqual({ default: null, custom: "custom" });
  });

  it("maps network failures to network_error and lets aborts through", async () => {
    csrfEndpoint();
    server.use(
      http.get(`${BASE}/down`, () => HttpResponse.error()),
      http.get(`${BASE}/slow`, async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json({});
      }),
    );
    const client = new Http({ baseUrl: BASE });
    const error = (await client.get("/down").catch((e) => e)) as ApiError & { cause?: unknown };
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: "network_error" });
    expect(error.cause).toBeDefined();
    const controller = new AbortController();
    const pending = client.get("/slow", undefined, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  it("uploads through fetch when XMLHttpRequest is missing and reports completion", async () => {
    csrfEndpoint(["up"]);
    let received: { name?: string; size?: number; purpose?: string; csrf?: string | null; type?: string | null } = {};
    server.use(
      http.post(`${BASE}/files`, async ({ request }) => {
        const form = await request.formData();
        const file = form.get("file") as File;
        received = {
          name: file.name,
          size: file.size,
          purpose: String(form.get("purpose")),
          csrf: request.headers.get("X-CSRFToken"),
          type: request.headers.get("Content-Type"),
        };
        return HttpResponse.json({ id: "f1" }, { status: 201 });
      }),
    );
    expect(typeof XMLHttpRequest).toBe("undefined");
    const client = new Http({ baseUrl: BASE });
    const form = new FormData();
    form.append("file", new File(["hello world"], "hello.txt", { type: "text/plain" }));
    form.append("purpose", "attachment");
    const progress: number[] = [];
    const result = await client.upload<{ id: string }>("POST", "/files", form, { onProgress: (p) => progress.push(p) });
    expect(result).toEqual({ id: "f1" });
    expect(progress).toEqual([1]);
    expect(received).toMatchObject({ name: "hello.txt", size: 11, purpose: "attachment", csrf: "up" });
    expect(received.type).toMatch(/^multipart\/form-data; boundary=/);
  });

  it("streams SSE responses and throws ApiError when the server answers JSON instead", async () => {
    csrfEndpoint();
    server.use(
      http.post(`${BASE}/stream`, ({ request }) => {
        expect(request.headers.get("Accept")).toBe("text/event-stream");
        return new HttpResponse('event: delta\ndata: {"text":"Hi"}\n\nevent: done\ndata: {}\n\n', {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
      http.post(`${BASE}/stream-error`, () =>
        HttpResponse.json({ error: { status: 429, code: "quota_exceeded", message: "Limit." } }, { status: 429 }),
      ),
    );
    const client = new Http({ baseUrl: BASE });
    const events = [];
    for await (const e of client.stream("POST", "/stream", { body: {} })) events.push(e);
    expect(events).toEqual([
      { event: "delta", data: { text: "Hi" }, id: undefined },
      { event: "done", data: {}, id: undefined },
    ]);
    const consume = async () => {
      for await (const _ of client.stream("POST", "/stream-error", { body: {} })) {
        // nothing
      }
    };
    await expect(consume()).rejects.toMatchObject({ code: "quota_exceeded", status: 429 });
  });
});
