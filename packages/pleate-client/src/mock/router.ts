import { delay, http, type HttpHandler } from "msw";

import type { MockDb, MockUser } from "./db.ts";
import { errorResponse, fail, MockError, notFound } from "./util.ts";

export interface MockHandlerOptions {
  db?: MockDb;
  /** Where the API is mounted: a path (`/api`, any origin) or an absolute URL. Default `/api`. */
  baseUrl?: string;
  /** Milliseconds added to every response. Default 300. */
  latency?: number;
  /** Pause between streamed chat words, in ms. Default 35. */
  streamDelay?: number;
  /** Interval of the fake live notifications on `/notifications/stream`, in ms. Default 20000, 0 turns them off. */
  liveNotificationInterval?: number;
}

export interface Ctx {
  db: MockDb;
  request: Request;
  url: URL;
  params: Record<string, string>;
  options: Required<Omit<MockHandlerOptions, "db">>;
  /** The signed in user, set on routes that need one. */
  user: MockUser;
  body<T = Record<string, unknown>>(): Promise<T>;
}

type Access = "public" | "user" | "staff";
type Resolver = (ctx: Ctx) => Response | Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  access: Access;
  resolve: Resolver;
}

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class Router {
  readonly routes: Route[] = [];

  private add(method: string, path: string, resolve: Resolver, access: Access) {
    const keys: string[] = [];
    const source = path
      .split("/")
      .map((part) => {
        if (part.startsWith(":")) {
          keys.push(part.slice(1));
          return "([^/]+)";
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/");
    this.routes.push({ method, pattern: new RegExp(`^${source}/?$`), keys, access, resolve });
  }

  get(path: string, resolve: Resolver, access: Access = "user") {
    this.add("GET", path, resolve, access);
  }
  post(path: string, resolve: Resolver, access: Access = "user") {
    this.add("POST", path, resolve, access);
  }
  put(path: string, resolve: Resolver, access: Access = "user") {
    this.add("PUT", path, resolve, access);
  }
  patch(path: string, resolve: Resolver, access: Access = "user") {
    this.add("PATCH", path, resolve, access);
  }
  delete(path: string, resolve: Resolver, access: Access = "user") {
    this.add("DELETE", path, resolve, access);
  }
}

/** The part of the URL after the base, or null when the request is not for the mock API. */
function relativePath(request: Request, baseUrl: string): string | null {
  const url = new URL(request.url);
  let base: URL | null = null;
  try {
    base = /^https?:\/\//.test(baseUrl) ? new URL(baseUrl) : null;
  } catch {
    base = null;
  }
  if (base && base.origin !== url.origin) return null;
  const prefix = (base ? base.pathname : baseUrl).replace(/\/$/, "");
  if (url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`)) return null;
  return url.pathname.slice(prefix.length) || "/";
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get("Content-Type") ?? "";
  if (type.includes("multipart/form-data")) return {};
  const text = await request.text();
  if (!text) return {};
  try {
    const data = JSON.parse(text);
    return data && typeof data === "object" ? data : {};
  } catch {
    throw fail(400, "parse_error", "JSON parse error.");
  }
}

export function toHandlers(router: Router, db: MockDb, options: Ctx["options"]): HttpHandler[] {
  const run = async (route: Route, request: Request, params: Record<string, string>): Promise<Response> => {
    if (options.latency > 0) await delay(options.latency);
    try {
      const authorization = request.headers.get("Authorization") ?? "";
      if (UNSAFE.has(request.method) && !authorization.startsWith("Bearer ") && !request.headers.get("X-CSRFToken")) {
        throw fail(403, "csrf_failed", "CSRF failed: CSRF token missing.");
      }
      const user = db.currentUser();
      if (route.access !== "public" && !user) {
        throw fail(401, "not_authenticated", "Authentication credentials were not provided.");
      }
      if (route.access === "staff" && !user?.is_staff) {
        throw fail(403, "permission_denied", "You do not have permission to perform this action.");
      }
      let cached: Promise<Record<string, unknown>> | undefined;
      const ctx: Ctx = {
        db,
        request,
        url: new URL(request.url),
        params,
        options,
        user: user as MockUser,
        body: <T,>() => (cached ??= readBody(request)) as Promise<T>,
      };
      return await route.resolve(ctx);
    } catch (error) {
      if (error instanceof MockError) return errorResponse(error);
      console.error("[pleate mock]", error);
      return errorResponse(fail(500, "server_error", "Something went wrong."));
    }
  };

  const handlers = router.routes.map((route) =>
    http.all(
      ({ request }) => {
        if (request.method !== route.method) return false;
        const path = relativePath(request, options.baseUrl);
        const match = path === null ? null : route.pattern.exec(path);
        if (!match) return false;
        const params: Record<string, string> = {};
        route.keys.forEach((key, i) => {
          params[key] = decodeURIComponent(match[i + 1]);
        });
        return { matches: true, params };
      },
      ({ request, params }) => run(route, request, params as Record<string, string>),
    ),
  );

  // Anything else under the base answers like Django would: a JSON 404 (or 405).
  handlers.push(
    http.all(
      ({ request }) => relativePath(request, options.baseUrl) !== null,
      async ({ request }) => {
        if (options.latency > 0) await delay(options.latency);
        const path = relativePath(request, options.baseUrl) ?? "";
        const known = router.routes.some((r) => r.pattern.test(path));
        if (known && request.method !== "OPTIONS") {
          return errorResponse(fail(405, "method_not_allowed", `Method "${request.method}" not allowed.`));
        }
        return errorResponse(notFound());
      },
    ),
  );
  return handlers;
}
