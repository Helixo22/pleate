"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { SearchType } from "../api.ts";
import { keys, usePleateClient } from "./provider.tsx";

/**
 * Searches the signed in user's files, conversations and notifications.
 * Runs once `q` has 2 characters; debounce the input if it changes on every key.
 *
 *     const { results } = useSearch(query, { types: ["files"] });
 */
export function useSearch(q: string, options: { types?: SearchType[]; limit?: number } = {}) {
  const client = usePleateClient();
  const term = q.trim();
  const { types, limit } = options;
  const query = useQuery({
    queryKey: keys.search(term, types, limit),
    queryFn: ({ signal }) => client.search(term, { types, limit, signal }),
    enabled: term.length >= 2 && term.length <= 100,
    placeholderData: keepPreviousData,
  });
  return { ...query, results: query.data ?? [] };
}
