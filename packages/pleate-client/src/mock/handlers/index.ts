import type { HttpHandler } from "msw";

import { createMockDb } from "../db.ts";
import { type Ctx, type MockHandlerOptions, Router, toHandlers } from "../router.ts";
import { adminRoutes } from "./admin.ts";
import { aiRoutes } from "./ai.ts";
import { authRoutes } from "./auth.ts";
import { commerceRoutes } from "./commerce.ts";
import { keyAndFileRoutes } from "./keys-files.ts";
import { notificationRoutes } from "./notifications.ts";

/**
 * msw handlers that answer every pleate-backend endpoint from an in memory
 * database, with the same shapes, status codes and error codes.
 *
 *     const server = setupServer(...createMockHandlers({ latency: 0 }));
 */
export function createMockHandlers(options: MockHandlerOptions = {}): HttpHandler[] {
  const db = options.db ?? createMockDb();
  const resolved: Ctx["options"] = {
    baseUrl: (options.baseUrl ?? "/api").replace(/\/$/, ""),
    latency: options.latency ?? 300,
    streamDelay: options.streamDelay ?? 35,
    liveNotificationInterval: options.liveNotificationInterval ?? 20_000,
  };
  db.baseUrl = resolved.baseUrl;
  const router = new Router();
  authRoutes(router);
  keyAndFileRoutes(router);
  notificationRoutes(router);
  aiRoutes(router);
  commerceRoutes(router);
  adminRoutes(router);
  return toHandlers(router, db, resolved);
}
