import type { SetupWorker } from "msw/browser";

import { createMockDb, type MockDb } from "./db.ts";
import { createMockHandlers } from "./handlers/index.ts";
import type { MockHandlerOptions } from "./router.ts";

let db: MockDb | undefined;
let started: Promise<SetupWorker> | undefined;

/**
 * Starts the mock backend in the browser (msw Service Worker). Safe to call
 * many times: every call returns the same promise. Copy the worker script
 * once with `npx msw init public/` so it is served at /mockServiceWorker.js.
 *
 *     await startMockWorker();          // then render the app
 */
export function startMockWorker(options: MockHandlerOptions & { serviceWorkerUrl?: string } = {}): Promise<SetupWorker> {
  started ??= (async () => {
    const { setupWorker } = await import("msw/browser");
    db = options.db ?? createMockDb();
    const worker = setupWorker(...createMockHandlers({ ...options, db }));
    await worker.start({
      serviceWorker: { url: options.serviceWorkerUrl ?? "/mockServiceWorker.js" },
      onUnhandledFrame: "bypass",
      quiet: true,
    });
    return worker;
  })();
  started.catch(() => {
    started = undefined;
  });
  return started;
}

/** Puts the seed data back (and signs the demo user back in). */
export function resetMockDb(): void {
  db?.reset();
}

/** The database behind the running worker, to inspect or tweak it in a demo. */
export function getMockDb(): MockDb | undefined {
  return db;
}
