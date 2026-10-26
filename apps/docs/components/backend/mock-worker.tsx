// Starts the in-browser mock backend. Loaded with next/dynamic and ssr: false: msw/browser has no server build.
"use client";

import { startMockWorker } from "pleate-client/mock/browser";
import { useEffect } from "react";

let started: Promise<unknown> | null = null;

export default function MockWorker({ onReady, onError }: { onReady: () => void; onError: () => void }) {
  useEffect(() => {
    // A live notification every 8 seconds, so the bell demo has something to show.
    started ??= startMockWorker({ liveNotificationInterval: 8000 });
    let live = true;
    started.then(
      () => live && onReady(),
      () => live && onError(),
    );
    return () => {
      live = false;
    };
  }, [onReady, onError]);
  return null;
}
