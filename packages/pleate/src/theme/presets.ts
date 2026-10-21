// The built-in palettes: one seed each, expanded by createPalette at build time into styles/palettes.css
// (npm run palettes). The first one is the default, applied when <html> has no data-palette.

export const PALETTES = {
  helpintrip: { label: "Helpintrip", seed: "#2563eb" },
  violet: { label: "Violet", seed: "#5e4cf0" },
  indigo: { label: "Indigo", seed: "#4f46e5" },
  ocean: { label: "Ocean", seed: "#0284c7" },
  teal: { label: "Teal", seed: "#0d9488" },
  green: { label: "Green", seed: "#16a34a" },
  amber: { label: "Amber", seed: "#f5b301" },
  orange: { label: "Orange", seed: "#ea580c" },
  rose: { label: "Rose", seed: "#e11d48" },
  graphite: { label: "Graphite", seed: "#3f3f46" },
} as const;

export type PaletteName = keyof typeof PALETTES;
export const DEFAULT_PALETTE: PaletteName = "helpintrip";
export const CUSTOM_PALETTE = "custom";
