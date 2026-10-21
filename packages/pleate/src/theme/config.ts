// Shared theme settings: what is stored, under which key, and how it is written onto <html>.
// Used both by the inline boot script (serialized, runs before paint) and by the client store.
import { DEFAULT_PALETTE } from "./presets.ts";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type MotionPreference = "system" | "off";

export type ThemeConfig = {
  /** localStorage key holding the visitor's choice. */
  storageKey?: string;
  defaultTheme?: ThemePreference;
  /** A preset name from PALETTES (or any name your own CSS defines). */
  defaultPalette?: string;
};

export type StoredTheme = {
  theme?: ThemePreference;
  palette?: string;
  /** Seed of the custom palette and its generated CSS (kept so the boot script needs no color math). */
  custom?: string;
  css?: string;
  motion?: MotionPreference;
};

export const CUSTOM_STYLE_ID = "pleate-custom-palette";

export function resolveConfig(config: ThemeConfig = {}) {
  return {
    storageKey: config.storageKey ?? "pleate",
    defaultTheme: config.defaultTheme ?? "system",
    defaultPalette: config.defaultPalette ?? DEFAULT_PALETTE,
  } as const;
}

// The boot script: tiny, dependency-free, safe to inline. It must mirror applyToDocument in store.ts.
export function bootScript(config: ThemeConfig = {}) {
  const c = resolveConfig(config);
  const args = [c.storageKey, c.defaultTheme, c.defaultPalette, CUSTOM_STYLE_ID].map((v) => JSON.stringify(v)).join(",");
  return `(function(k,t,p,id){try{var s={};try{s=JSON.parse(localStorage.getItem(k)||"{}")||{}}catch(e){}var d=document.documentElement,m=s.theme||t,r=m==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;d.setAttribute("data-theme",r);d.style.colorScheme=r;var n=s.palette||p;d.setAttribute("data-palette",n);if(n==="custom"&&s.css){var e=document.createElement("style");e.id=id;e.textContent=s.css;document.head.appendChild(e)}if(s.motion==="off")d.setAttribute("data-motion","off")}catch(e){}})(${args})`;
}
