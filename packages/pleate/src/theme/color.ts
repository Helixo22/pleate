// Color math for palette generation: hex <-> OKLCH, sRGB gamut mapping and WCAG contrast.
// Pure functions with no DOM access, so they run on the server, in the browser and in build scripts.

export type Oklch = { l: number; c: number; h: number };
type Rgb = [number, number, number];

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export function parseHex(hex: string): Rgb {
  let s = hex.trim().replace(/^#/, "");
  if (s.length === 3 || s.length === 4) s = [...s.slice(0, 3)].map((ch) => ch + ch).join("");
  if (!/^[0-9a-f]{6}/i.test(s)) throw new Error(`pleate: invalid hex color "${hex}"`);
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255) as Rgb;
}

export function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(clamp(v) * 255).toString(16).padStart(2, "0")).join("")}`;
}

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLinear = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);

function linearToOklab([r, g, b]: Rgb): Rgb {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLinear([L, a, b]: Rgb): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function hexToOklch(hex: string): Oklch {
  const [L, a, b] = linearToOklab(parseHex(hex).map(toLinear) as Rgb);
  const c = Math.hypot(a, b);
  const h = c < 1e-4 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h };
}

function oklchToLinear({ l, c, h }: Oklch): Rgb {
  const rad = (h * Math.PI) / 180;
  return oklabToLinear([l, c * Math.cos(rad), c * Math.sin(rad)]);
}

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

// Keeps lightness and hue, lowering chroma until the color fits in sRGB (CSS Color 4 style, by bisection).
export function oklchToHex(color: Oklch): string {
  const l = clamp(color.l);
  if (inGamut(oklchToLinear({ ...color, l }))) return toHex(oklchToLinear({ ...color, l }).map(fromLinear) as Rgb);
  let lo = 0;
  let hi = color.c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinear({ l, c: mid, h: color.h }))) lo = mid;
    else hi = mid;
  }
  return toHex(oklchToLinear({ l, c: lo, h: color.h }).map(fromLinear) as Rgb);
}

export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Moves lightness (keeping hue and chroma intent) until `test` passes. `direction` -1 darkens, 1 lightens.
// Returns the passing color closest to the start, or the extreme if none passes.
export function shiftUntil(start: Oklch, direction: -1 | 1, test: (hex: string) => boolean): string {
  const first = oklchToHex(start);
  if (test(first)) return first;
  for (let step = 1; step <= 100; step++) {
    const l = start.l + direction * step * 0.01;
    if (l < 0 || l > 1) break;
    const hex = oklchToHex({ ...start, l });
    if (test(hex)) return hex;
  }
  return direction < 0 ? "#000000" : "#ffffff";
}
