// Palette generation from one brand color. The seed becomes, for light and dark:
// - accent: the fill behind on-accent text (buttons, switches, selected states), AA with on-accent;
// - accent-ink: the accent used as text and icons on the page, AA on the page background and on cards;
// - a 50–950 tonal scale (OKLCH lightness ramp, chroma tapered at the ends) for charts and tints.
// Hover, pressed, soft and focus-ring shades are derived in CSS (tokens.css), so they follow any palette.
import { contrast, hexToOklch, oklchToHex, shiftUntil } from "./color.ts";

export type PaletteMode = {
  accent: string;
  onAccent: string;
  accentInk: string;
};

export type Palette = {
  seed: string;
  light: PaletteMode;
  dark: PaletteMode;
  scale: Record<ScaleStep, string>;
};

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ScaleStep = (typeof SCALE_STEPS)[number];
const SCALE_L: Record<ScaleStep, number> = {
  50: 0.975, 100: 0.94, 200: 0.885, 300: 0.81, 400: 0.72, 500: 0.635,
  600: 0.555, 700: 0.475, 800: 0.395, 900: 0.32, 950: 0.24,
};

// The page colors the accent has to read on (kept in sync with tokens.css).
const LIGHT = { bg: "#f2f2f7", surface: "#ffffff" };
const DARK = { bg: "#000000", surface: "#1c1c1e", surface2: "#2c2c2e" };
const WHITE = "#ffffff";
const INK = "#0b0b0f";
const AA = 4.5;

function bestOn(fill: string) {
  return contrast(fill, WHITE) >= contrast(fill, INK) ? WHITE : INK;
}

export function createPalette(seed: string): Palette {
  const base = hexToOklch(seed);
  const seedHex = oklchToHex(base);

  // Very light seeds (yellow, lime, sky) stay as they are and take dark text; the rest darken until white text passes.
  const lightSeed = contrast(seedHex, INK) >= 9 && contrast(seedHex, WHITE) < 2.6;
  const lightAccent = lightSeed ? seedHex : shiftUntil(base, -1, (hex) => contrast(hex, WHITE) >= AA);
  const lightInk = shiftUntil(base, -1, (hex) => contrast(hex, LIGHT.bg) >= AA && contrast(hex, LIGHT.surface) >= AA);

  // In dark mode fills must stand out from the dark cards; ink lightens until it reads on the raised surfaces.
  const darkAccent = shiftUntil(hexToOklch(lightAccent), 1, (hex) => contrast(hex, DARK.surface) >= 2.2);
  const darkInk = shiftUntil(base, 1, (hex) => contrast(hex, DARK.surface2) >= AA);

  const scale = Object.fromEntries(
    SCALE_STEPS.map((step) => {
      const l = SCALE_L[step];
      // Chroma peaks around the middle of the ramp and fades towards white and black.
      const taper = 1 - Math.abs(l - 0.6) * 1.15;
      return [step, oklchToHex({ l, c: base.c * Math.max(0.12, taper), h: base.h })];
    }),
  ) as Record<ScaleStep, string>;

  return {
    seed: seedHex,
    light: { accent: lightAccent, onAccent: lightSeed ? INK : bestOn(lightAccent), accentInk: lightInk },
    dark: { accent: darkAccent, onAccent: bestOn(darkAccent), accentInk: darkInk },
    scale,
  };
}

function modeVars(mode: PaletteMode) {
  return `--pl-accent: ${mode.accent}; --pl-on-accent: ${mode.onAccent}; --pl-accent-ink: ${mode.accentInk};`;
}

// CSS for a palette bound to a selector, e.g. `[data-palette="ocean"]`. Dark values apply when the element or an
// ancestor carries data-theme="dark".
export function paletteToCss(selector: string, palette: Palette, { includeRoot = false } = {}) {
  const scale = SCALE_STEPS.map((step) => `--pl-accent-${step}: ${palette.scale[step]};`).join(" ");
  const light = includeRoot ? `:root, ${selector}` : selector;
  const dark = [
    `[data-theme="dark"]${selector}`,
    `[data-theme="dark"] ${selector}`,
    ...(includeRoot ? [`:root[data-theme="dark"]:not([data-palette])`] : []),
  ].join(", ");
  return `${light} { ${modeVars(palette.light)} ${scale} }\n${dark} { ${modeVars(palette.dark)} }\n`;
}

// The CSS variables of one mode as an object, for inline styles (a single surface pinned to a palette and theme).
export function paletteStyle(palette: Palette, mode: "light" | "dark" = "light"): Record<string, string> {
  const m = palette[mode];
  return {
    "--pl-accent": m.accent,
    "--pl-on-accent": m.onAccent,
    "--pl-accent-ink": m.accentInk,
    ...Object.fromEntries(SCALE_STEPS.map((step) => [`--pl-accent-${step}`, palette.scale[step]])),
  };
}
