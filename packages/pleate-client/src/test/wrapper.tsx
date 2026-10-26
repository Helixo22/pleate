import { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import type { PleateClient } from "../api.ts";
import { PleateProvider } from "../react/provider.tsx";
import { createTestClient } from "./backend.ts";

/** A wrapper for renderHook: a fresh client and QueryClient (no retries, no cache sharing). */
export function wrapper(client: PleateClient = createTestClient()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: Infinity }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <PleateProvider client={client} queryClient={queryClient}>
        {children}
      </PleateProvider>
    );
  }
  return { Wrapper, queryClient, client };
}

