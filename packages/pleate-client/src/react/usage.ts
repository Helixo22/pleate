"use client";

import { useQuery } from "@tanstack/react-query";

import type { UsageItem } from "../api.ts";
import { keys, usePleateClient } from "./provider.tsx";

const GB = 1024 ** 3;
const MB = 1024 ** 2;

/** Props for one <UsageMeter>. Bytes are shown in GB or MB. */
export function usageMeterProps(item: UsageItem & { limit: number }) {
  const scale = item.unit === "bytes" ? (item.limit >= GB ? GB : MB) : 1;
  const unit = item.unit === "bytes" ? (scale === GB ? "GB" : "MB") : item.unit;
  return {
    label: item.label,
    segments: [{ label: item.label, value: item.used / scale }],
    max: item.limit / scale,
    unit,
  };
}

/**
 * The plan and how much of each limit is used. Spread each entry of
 * `usageMeterProps` on a <UsageMeter>; items without a limit are left out.
 *
 *     const usage = useUsage();
 *     usage.usageMeterProps.map((p) => <UsageMeter key={p.label} {...p} />)
 */
export function useUsage() {
  const client = usePleateClient();
  const query = useQuery({ queryKey: keys.usage, queryFn: client.usage.summary });
  const items = query.data?.items ?? [];
  return {
    ...query,
    plan: query.data?.plan ?? null,
    items,
    usageMeterProps: items
      .filter((item): item is UsageItem & { limit: number } => item.limit !== null)
      .map(usageMeterProps),
  };
}
