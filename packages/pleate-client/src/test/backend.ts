import { setupServer } from "msw/node";

import { createPleateClient, type PleateClient } from "../api.ts";
import { createMockDb, createMockHandlers, type MockDb, type MockDbOptions } from "../mock/index.ts";

export const BASE = "http://localhost/api";

/** The mock backend on msw/node, with no latency and instant streams. */
export function createTestBackend(options: MockDbOptions & { liveNotificationInterval?: number } = {}) {
  const { liveNotificationInterval = 0, ...dbOptions } = options;
  const db = createMockDb(dbOptions);
  const handlers = () =>
    createMockHandlers({ db, baseUrl: BASE, latency: 0, streamDelay: 0, liveNotificationInterval });
  const server = setupServer(...handlers());
  return { db, server, handlers };
}

export function createTestClient(): PleateClient {
  return createPleateClient({ baseUrl: BASE });
}

export type { MockDb };
