"use client";

import { SessionList } from "pleate/session-list";
import { useSessions } from "pleate-client/react";

export default function SessionsDemo() {
  const sessions = useSessions();
  return (
    <div className="mx-auto w-full max-w-xl">
      <SessionList {...sessions.sessionListProps} />
    </div>
  );
}
