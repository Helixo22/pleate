// SessionList: where the account is signed in. One row per device (browser and OS, a desktop or phone glyph, IP,
// location, last activity) with the current one marked "This device"; every other row has a Sign out button that
// spins while onRevoke runs, and a footer button signs out everywhere else after a confirmation.
"use client";

import { useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { MonitorIcon, PhoneIcon } from "../../lib/icons.tsx";
import { formatTimeAgo, toDate, type DateInput } from "../../lib/time.ts";
import { AlertDialog } from "../alert-dialog/alert-dialog.tsx";
import { Badge } from "../badge/badge.tsx";
import { Button } from "../button/button.tsx";
import { EmptyState } from "../empty-state/empty-state.tsx";
import { Skeleton } from "../skeleton/skeleton.tsx";

export type Session = {
  id: string;
  browser: string;
  os: string;
  mobile: boolean;
  ip?: string;
  location?: string;
  lastSeenAt: DateInput;
  current: boolean;
};

export type SessionListLabels = {
  title?: string;
  thisDevice?: string;
  activeNow?: string;
  lastActive?: (timeAgo: string) => string;
  on?: string;
  revoke?: string;
  revokeLabel?: (session: Session) => string;
  revokeOthers?: string;
  confirmTitle?: string;
  confirmDescription?: string;
  confirm?: string;
  cancel?: string;
  loading?: string;
  emptyTitle?: string;
};

const L = {
  title: "Where you're signed in",
  thisDevice: "This device",
  activeNow: "Active now",
  lastActive: (t: string) => `Last active ${t}`,
  on: "on",
  revoke: "Sign out",
  revokeLabel: (s: Session) => `Sign out ${s.browser} on ${s.os}`,
  revokeOthers: "Sign out of all other sessions",
  confirmTitle: "Sign out everywhere else?",
  confirmDescription: "Every other browser and device will need to sign in again. This one stays signed in.",
  confirm: "Sign out",
  cancel: "Cancel",
  loading: "Loading sessions",
  emptyTitle: "No active sessions",
};

export type SessionListProps = {
  sessions: Session[];
  /** Sign out one session. Return a promise to show a spinner on its row. */
  onRevoke?: (id: string) => void | Promise<void>;
  /** Sign out every session except the current one (asks for confirmation first). */
  onRevokeOthers?: () => void | Promise<void>;
  /** Rows being signed out, when you track it yourself. */
  revokingIds?: string[];
  loading?: boolean;
  /** Show the title above the list. */
  showTitle?: boolean;
  now?: Date;
  locale?: string;
  labels?: SessionListLabels;
  className?: string;
};

export function SessionList({
  sessions,
  onRevoke,
  onRevokeOthers,
  revokingIds,
  loading,
  showTitle = false,
  now,
  locale,
  labels,
  className,
}: SessionListProps) {
  const l = { ...L, ...labels };
  const [pending, setPending] = useState<string[]>([]);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const busy = new Set([...pending, ...(revokingIds ?? [])]);
  const ordered = [...sessions].sort((a, b) => Number(b.current) - Number(a.current));
  const others = sessions.filter((s) => !s.current).length;

  const revoke = async (id: string) => {
    if (!onRevoke) return;
    setPending((p) => [...p, id]);
    try {
      await onRevoke(id);
    } finally {
      setPending((p) => p.filter((x) => x !== id));
    }
  };
  const revokeOthers = async () => {
    if (!onRevokeOthers) return;
    setRevokingOthers(true);
    try {
      await onRevokeOthers();
    } finally {
      setRevokingOthers(false);
    }
  };

  let body: ReactNode;
  if (loading && sessions.length === 0) {
    body = (
      <ul aria-busy="true" className="flex flex-col">
        <li className="sr-only">{l.loading}</li>
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3.5 shadow-[inset_0_-1px_0_var(--pl-separator)] last:shadow-none">
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton shape="text" width="45%" className="text-subhead" />
              <Skeleton shape="text" width="65%" className="text-footnote" />
            </div>
          </li>
        ))}
      </ul>
    );
  } else if (sessions.length === 0) {
    body = <EmptyState size="sm" icon={<MonitorIcon />} title={l.emptyTitle} />;
  } else {
    body = (
      <ul className="flex flex-col">
        {ordered.map((s) => {
          const recent = (now ?? new Date()).getTime() - toDate(s.lastSeenAt).getTime() < 5 * 60_000;
          const meta = [s.ip, s.location].filter(Boolean).join(" · ");
          return (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3.5 shadow-[inset_0_-1px_0_var(--pl-separator)] last:shadow-none">
              <span
                aria-hidden="true"
                className={cn("grid size-10 shrink-0 place-items-center rounded-xl [&_svg]:size-5", s.current ? "bg-accent-soft text-accent-ink" : "bg-fill-2 text-fg-muted")}
              >
                {s.mobile ? <PhoneIcon strokeWidth={2} /> : <MonitorIcon strokeWidth={2} />}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="min-w-0 text-subhead font-semibold break-words text-fg">
                    {s.browser} <span className="font-normal text-fg-muted">{l.on}</span> {s.os}
                  </span>
                  {s.current && (
                    <Badge tone="success" size="sm" dot>
                      {l.thisDevice}
                    </Badge>
                  )}
                </div>
                {meta && <span className="text-footnote text-fg-muted [overflow-wrap:anywhere] pl-tabular">{meta}</span>}
                <span className="text-footnote text-fg-muted" suppressHydrationWarning>
                  {s.current || recent ? l.activeNow : l.lastActive(formatTimeAgo(s.lastSeenAt, { now, locale }))}
                </span>
              </div>
              {!s.current && onRevoke && (
                <Button variant="gray" tone="danger" size="sm" loading={busy.has(s.id)} aria-label={l.revokeLabel(s)} onClick={() => revoke(s.id)}>
                  {l.revoke}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <section className={cn("flex w-full min-w-0 flex-col gap-2", className)} aria-label={showTitle ? undefined : l.title}>
      {showTitle && <h3 className="px-4 text-footnote font-semibold text-fg-muted">{l.title}</h3>}
      <div className="overflow-hidden rounded-2xl bg-surface shadow-xs">{body}</div>
      {onRevokeOthers && others > 0 && (
        <div className="flex justify-end pt-1">
          <AlertDialog
            open={confirming}
            onOpenChange={setConfirming}
            trigger={
              <Button variant="plain" tone="danger" size="sm" loading={revokingOthers}>
                {l.revokeOthers}
              </Button>
            }
            title={l.confirmTitle}
            description={l.confirmDescription}
            actions={[
              { label: l.cancel, role: "cancel" },
              { label: l.confirm, role: "destructive", onSelect: () => void revokeOthers() },
            ]}
          />
        </div>
      )}
    </section>
  );
}
