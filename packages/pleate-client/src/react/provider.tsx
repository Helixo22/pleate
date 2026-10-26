"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useState } from "react";

import { createPleateClient, type PleateClient } from "../api.ts";
import type { HttpOptions } from "../http.ts";

const ClientContext = createContext<PleateClient | null>(null);

export type PleateProviderProps = {
  /** A client from createPleateClient(). Or pass `options` and one is created. */
  client?: PleateClient;
  options?: HttpOptions;
  /** Reuse your app's QueryClient. One is created otherwise. */
  queryClient?: QueryClient;
  children: ReactNode;
};

/**
 * Makes the client and a TanStack QueryClient available to every hook.
 *
 *     <PleateProvider options={{ baseUrl: "/api" }}>{children}</PleateProvider>
 */
export function PleateProvider({ client, options, queryClient, children }: PleateProviderProps) {
  const [api] = useState(() => client ?? createPleateClient(options));
  const [qc] = useState(
    () =>
      queryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (count, error) => count < 2 && (error as { status?: number })?.status !== 401,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={qc}>
      <ClientContext.Provider value={api}>{children}</ClientContext.Provider>
    </QueryClientProvider>
  );
}

export function usePleateClient(): PleateClient {
  const client = useContext(ClientContext);
  if (!client) throw new Error("usePleateClient must be used inside <PleateProvider>.");
  return client;
}

export { useQueryClient };

/** Query keys, exported so apps can invalidate them. */
export const keys = {
  me: ["pleate", "me"] as const,
  sessions: ["pleate", "sessions"] as const,
  mfa: ["pleate", "mfa"] as const,
  oauthProviders: ["pleate", "oauth", "providers"] as const,
  oauthAccounts: ["pleate", "oauth", "accounts"] as const,
  apiKeys: ["pleate", "api-keys"] as const,
  files: ["pleate", "files"] as const,
  notifications: ["pleate", "notifications"] as const,
  unread: ["pleate", "notifications", "unread"] as const,
  conversations: ["pleate", "ai", "conversations"] as const,
  messages: (id: string) => ["pleate", "ai", "messages", id] as const,
  models: ["pleate", "ai", "models"] as const,
  suggestions: ["pleate", "ai", "suggestions"] as const,
  plans: ["pleate", "billing", "plans"] as const,
  subscription: ["pleate", "billing", "subscription"] as const,
  webhooks: ["pleate", "webhooks"] as const,
  list: (path: string) => ["pleate", "list", path] as const,
};
