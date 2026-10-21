// <ThemeProvider> and useTheme(): read and change theme (light/dark/system), palette (preset or custom color) and
// the motion preference at runtime. State lives in localStorage and on <html> (data-theme, data-palette,
// data-motion); ThemeScript applies it before paint, this provider keeps it in sync afterwards (system theme changes,
// other tabs) and animates switches with a View Transition when motion is allowed.
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import {
  CUSTOM_STYLE_ID,
  resolveConfig,
  type MotionPreference,
  type ResolvedTheme,
  type StoredTheme,
  type ThemeConfig,
  type ThemePreference,
} from "./config.ts";
import { createPalette, paletteToCss } from "./palette.ts";
import { CUSTOM_PALETTE } from "./presets.ts";

export type ThemeState = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  palette: string;
  customColor: string | null;
  motion: MotionPreference;
};

export type ThemeContextValue = ThemeState & {
  setTheme: (theme: ThemePreference) => void;
  setPalette: (palette: string) => void;
  /** Builds a palette from one color (any hex) and switches to it. */
  setCustomColor: (hex: string) => void;
  setMotion: (motion: MotionPreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const DARK_QUERY = "(prefers-color-scheme: dark)";

function createStore(config: ReturnType<typeof resolveConfig>) {
  const listeners = new Set<() => void>();
  const serverState: ThemeState = {
    theme: config.defaultTheme,
    resolvedTheme: config.defaultTheme === "dark" ? "dark" : "light",
    palette: config.defaultPalette,
    customColor: null,
    motion: "system",
  };
  let cache: { key: string; state: ThemeState } | null = null;

  const readStored = (): StoredTheme => {
    try {
      return JSON.parse(localStorage.getItem(config.storageKey) ?? "{}") ?? {};
    } catch {
      return {};
    }
  };

  const systemDark = () => window.matchMedia(DARK_QUERY).matches;

  const getSnapshot = (): ThemeState => {
    const stored = readStored();
    const theme = stored.theme ?? config.defaultTheme;
    const resolvedTheme: ResolvedTheme = theme === "system" ? (systemDark() ? "dark" : "light") : theme;
    const key = JSON.stringify([stored.theme, stored.palette, stored.custom, stored.motion, resolvedTheme]);
    if (cache?.key === key) return cache.state;
    const state: ThemeState = {
      theme,
      resolvedTheme,
      palette: stored.palette && config.palettes.includes(stored.palette) ? stored.palette : config.defaultPalette,
      customColor: stored.custom ?? null,
      motion: stored.motion ?? "system",
    };
    cache = { key, state };
    return state;
  };

  const applyToDocument = (stored: StoredTheme) => {
    const root = document.documentElement;
    const { resolvedTheme, palette, motion } = getSnapshot();
    root.setAttribute("data-theme", resolvedTheme);
    root.style.colorScheme = resolvedTheme;
    root.setAttribute("data-palette", palette);
    if (motion === "off") root.setAttribute("data-motion", "off");
    else root.removeAttribute("data-motion");
    let style = document.getElementById(CUSTOM_STYLE_ID);
    if (palette === CUSTOM_PALETTE && stored.css) {
      if (!style) {
        style = document.createElement("style");
        style.id = CUSTOM_STYLE_ID;
        document.head.appendChild(style);
      }
      style.textContent = stored.css;
    }
  };

  const notify = () => listeners.forEach((listener) => listener());

  const write = (patch: StoredTheme) => {
    const next = { ...readStored(), ...patch };
    try {
      localStorage.setItem(config.storageKey, JSON.stringify(next));
    } catch {}
    const run = () => {
      applyToDocument(next);
      notify();
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const reduced = next.motion === "off" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (doc.startViewTransition && !reduced) doc.startViewTransition(run);
    else run();
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const media = window.matchMedia(DARK_QUERY);
    const onSystem = () => {
      applyToDocument(readStored());
      listener();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== config.storageKey) return;
      applyToDocument(readStored());
      listener();
    };
    media.addEventListener("change", onSystem);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      media.removeEventListener("change", onSystem);
      window.removeEventListener("storage", onStorage);
    };
  };

  return { subscribe, getSnapshot, getServerSnapshot: () => serverState, write };
}

export function ThemeProvider({ children, ...config }: ThemeConfig & { children: ReactNode }) {
  const resolved = resolveConfig(config);
  const { storageKey, defaultTheme, defaultPalette } = resolved;
  const known = resolved.palettes.join(",");
  const store = useMemo(
    () => createStore(resolveConfig({ storageKey, defaultTheme, defaultPalette, palettes: known.split(",") })),
    [storageKey, defaultTheme, defaultPalette, known],
  );
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const setTheme = useCallback((theme: ThemePreference) => store.write({ theme }), [store]);
  const setPalette = useCallback((palette: string) => store.write({ palette }), [store]);
  const setMotion = useCallback((motion: MotionPreference) => store.write({ motion }), [store]);
  const setCustomColor = useCallback(
    (hex: string) => {
      const css = paletteToCss(`[data-palette="${CUSTOM_PALETTE}"]`, createPalette(hex));
      store.write({ palette: CUSTOM_PALETTE, custom: hex, css });
    },
    [store],
  );

  // A palette or theme set by ThemeScript with a different config would drift: re-apply once on mount.
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-palette")) root.setAttribute("data-palette", store.getSnapshot().palette);
  }, [store]);

  const value = useMemo(
    () => ({ ...state, setTheme, setPalette, setCustomColor, setMotion }),
    [state, setTheme, setPalette, setCustomColor, setMotion],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("pleate: useTheme() must be used inside <ThemeProvider>.");
  return context;
}
