"use client";

import { SessionList, type Session } from "pleate/session-list";
import { toast } from "pleate/toast";
import { useState } from "react";

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);
const SESSIONS: Session[] = [
  { id: "a", browser: "Safari", os: "macOS", mobile: false, ip: "84.12.201.7", location: "Milan, Italy", lastSeenAt: ago(0), current: true },
  { id: "b", browser: "Plate app", os: "iOS 19", mobile: true, ip: "84.12.201.33", location: "Milan, Italy", lastSeenAt: ago(25), current: false },
  { id: "c", browser: "Chrome", os: "Windows", mobile: false, ip: "151.40.18.92", location: "Rome, Italy", lastSeenAt: ago(60 * 26), current: false },
  { id: "d", browser: "Firefox", os: "Ubuntu", mobile: false, ip: "2a02:ab88:7::1f", location: "Berlin, Germany", lastSeenAt: ago(60 * 24 * 9), current: false },
];

export default function Demo() {
  const [sessions, setSessions] = useState(SESSIONS);
  const [loading, setLoading] = useState(false);
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  return (
    <div className="grid w-full max-w-xl gap-4">
      <SessionList
        showTitle
        sessions={sessions}
        loading={loading}
        onRevoke={async (id) => {
          await wait(900); // your API call
          setSessions((list) => list.filter((s) => s.id !== id));
          toast.success("Signed out of that session");
        }}
        onRevokeOthers={async () => {
          await wait(1200);
          setSessions((list) => list.filter((s) => s.current));
          toast.success("Signed out everywhere else");
        }}
      />
      <button
        type="button"
        className="pl-focus-ring justify-self-start rounded-md text-footnote font-semibold text-accent-ink"
        onClick={async () => {
          setSessions([]);
          setLoading(true);
          await wait(1500);
          setSessions(SESSIONS);
          setLoading(false);
        }}
      >
        Reload (shows the skeleton)
      </button>
    </div>
  );
}
