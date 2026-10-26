// Wraps a live backend demo: starts the in-browser mock backend (MSW) unless NEXT_PUBLIC_PLEATE_API_URL points to a
// real pleate-backend, provides the pleate-client hooks and, for demos that need an account, signs in the demo user.
"use client";

import { Badge } from "pleate/badge";
import { Spinner } from "pleate/spinner";
import { PleateProvider, usePleateClient, useQueryClient } from "pleate-client/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, type ReactNode } from "react";

const API_URL = process.env.NEXT_PUBLIC_PLEATE_API_URL;
export const DEMO_EMAIL = "ada@plate.dev";
export const DEMO_PASSWORD = "plate-demo-2026";
const DEMO_TOTP_CODE = "123456";

const MockWorker = dynamic(() => import("./mock-worker"), { ssr: false });

function Loading() {
  return (
    <div className="grid min-h-40 w-full place-items-center">
      <Spinner />
    </div>
  );
}

function SignedIn({ children }: { children: ReactNode }) {
  const client = usePleateClient();
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        // The mock has one session for the whole page: make sure it is the demo user's.
        const me = await client.auth.me().catch(() => null);
        if (me?.email !== DEMO_EMAIL) {
          const result = await client.auth.login({ email: DEMO_EMAIL, password: DEMO_PASSWORD, remember: false });
          if (result.mfa_required) await client.mfa.verify({ code: DEMO_TOTP_CODE });
        }
      } catch {
        // Shown by the demo itself (401 on its own requests).
      }
      if (!live) return;
      await qc.invalidateQueries({ queryKey: ["pleate"] });
      setReady(true);
    })();
    return () => {
      live = false;
    };
  }, [client, qc]);
  return ready ? <>{children}</> : <Loading />;
}

export function BackendDemo({
  children,
  signIn = false,
  hint,
}: {
  children: ReactNode;
  /** Sign in as the demo user before rendering (sessions, API keys, chat...). */
  signIn?: boolean;
  /** One line shown next to the badge, e.g. the demo credentials. */
  hint?: ReactNode;
}) {
  const [ready, setReady] = useState(!!API_URL);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Badge size="sm" tone={API_URL ? "success" : "info"} dot>
          {API_URL ? "Live backend" : "Mock backend"}
        </Badge>
        {hint && <span className="text-footnote text-fg-muted">{hint}</span>}
      </div>
      {!API_URL && <MockWorker onReady={onReady} onError={onError} />}
      {failed ? (
        <p className="text-subhead text-danger-ink">The mock backend could not start in this browser.</p>
      ) : !ready ? (
        <Loading />
      ) : (
        <PleateProvider options={{ baseUrl: API_URL ?? "/api" }}>
          {signIn ? <SignedIn>{children}</SignedIn> : children}
        </PleateProvider>
      )}
    </div>
  );
}
