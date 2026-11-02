// True when animations should stop: data-motion="off" on <html> (set through ThemeProvider's setMotion), or the system
// "reduce motion" setting unless the app set data-motion="on" (its own setting wins). Server render assumes motion is allowed.
"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  const observer = new MutationObserver(onChange);
  media.addEventListener("change", onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => {
    media.removeEventListener("change", onChange);
    observer.disconnect();
  };
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  const choice = document.documentElement.getAttribute("data-motion");
  if (choice === "on" || choice === "off") return choice === "off";
  return window.matchMedia(QUERY).matches;
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
