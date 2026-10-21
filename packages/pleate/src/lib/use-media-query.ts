// Subscribes to a CSS media query. Server render returns `fallback` (false by default).
"use client";

import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string, fallback = false) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => fallback);
}

/** Tailwind's md breakpoint: tablets and desktops. */
export const useIsDesktop = () => useMediaQuery("(min-width: 48rem)");
