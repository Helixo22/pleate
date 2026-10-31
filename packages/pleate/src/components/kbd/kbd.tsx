// Kbd: keycaps for a shortcut. `keys="mod+k"` or `keys={["shift", "?"]}`; "mod" reads ⌘ on Apple platforms and Ctrl
// elsewhere. The server renders the Ctrl spelling and switches after mount, so hydration never mismatches.
"use client";

import { useEffect, useState, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";

export function isApplePlatform() {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

/** "mod+shift+k" → ["mod", "shift", "k"]; a lone "+" stays a key. */
export function parseKeys(keys: string | string[]) {
  if (Array.isArray(keys)) return keys;
  return keys.split(/\+(?!$)/);
}

const APPLE: Record<string, string> = { mod: "⌘", meta: "⌘", ctrl: "⌃", shift: "⇧", alt: "⌥", option: "⌥" };
const OTHER: Record<string, string> = { mod: "Ctrl", meta: "Win", ctrl: "Ctrl", shift: "Shift", alt: "Alt", option: "Alt" };
const COMMON: Record<string, string> = {
  enter: "↵",
  return: "↵",
  esc: "Esc",
  escape: "Esc",
  tab: "Tab",
  space: "Space",
  backspace: "⌫",
  up: "↑",
  arrowup: "↑",
  down: "↓",
  arrowdown: "↓",
  left: "←",
  arrowleft: "←",
  right: "→",
  arrowright: "→",
};

export function formatKey(key: string, apple: boolean) {
  const k = key.toLowerCase();
  return (apple ? APPLE : OTHER)[k] ?? COMMON[k] ?? (key.length === 1 ? key.toUpperCase() : key);
}

const SIZE = {
  sm: "h-5 min-w-5 px-1 text-caption2",
  md: "h-6 min-w-6 px-1.5 text-caption1",
} as const;

export type KbdProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  /** One combination: "mod+k", "shift+?", or an array of keys. */
  keys: string | string[];
  size?: keyof typeof SIZE;
};

export function Kbd({ keys, size = "sm", className, ...props }: KbdProps) {
  const [apple, setApple] = useState(false);
  useEffect(() => setApple(isApplePlatform()), []);
  const caps = parseKeys(keys).map((k) => formatKey(k, apple));
  return (
    <kbd
      className={cn("inline-flex shrink-0 items-center gap-0.5 align-middle font-sans", className)}
      {...props}
    >
      {caps.map((cap, i) => (
        <kbd
          key={i}
          className={cn("pl-field inline-flex items-center justify-center rounded-xs bg-surface-2 font-mono font-medium text-fg-muted [--pl-field-border:var(--pl-separator)]", SIZE[size])}
        >
          {cap}
        </kbd>
      ))}
    </kbd>
  );
}
