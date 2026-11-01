// GradientAscii: soft drifting glows drawn in ASCII characters, from a sparse dot to a dense @, colored along a
// gradient. Under the pointer the characters scramble. Glyphs are 5x5 bitmaps drawn in the shader.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type GradientAsciiProps = BackgroundProps & {
  /** Character rows across the frame height. */
  rows?: number;
};

// " .:-=+*#%@" as 5x5 bitmaps, top row first; packed into ints below.
const GLYPHS = [
  ".....|.....|.....|.....|.....",
  ".....|.....|.....|.....|..#..",
  ".....|..#..|.....|..#..|.....",
  ".....|.....|.###.|.....|.....",
  ".....|.###.|.....|.###.|.....",
  ".....|..#..|.###.|..#..|.....",
  "#.#.#|.###.|#####|.###.|#.#.#",
  ".#.#.|#####|.#.#.|#####|.#.#.",
  "##..#|##.#.|..#..|.#.##|#..##",
  ".###.|#.###|#.#.#|#.##.|.###.",
].map((g) => [...g.replaceAll("|", "")].reduce((bits, ch, i) => (ch === "#" ? bits | (1 << i) : bits), 0));

const FRAGMENT = `${BG_GLSL}
uniform float uRows;
const int GLYPHS[10] = int[10](${GLYPHS.join(", ")});
void main() {
  vec2 fc = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 cs = vec2(0.6, 1.0) * uResolution.y / (uRows / uScale);
  vec2 cell = floor(fc / cs);
  vec2 pix = floor(fract(fc / cs) * vec2(7.0, 8.0)) - vec2(1.0, 1.5);
  vec2 cp = (vec2(cell.x + 0.5, uResolution.y / cs.y - cell.y - 0.5) * cs - 0.5 * uResolution) / uResolution.y / uScale;
  float v = 0.0, hue = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 b = vec2(sin(uTime * (0.21 + fi * 0.07) + fi * 2.0) * 0.6, cos(uTime * (0.17 + fi * 0.05) + fi * 1.3) * 0.3);
    float k = exp(-dot(cp - b, cp - b) * 4.0);
    v += k;
    hue += k * fi * 0.5;
  }
  hue /= max(v, 1e-3);
  v = clamp(v * 0.8, 0.0, 0.999);
  float near = uPointerActive * smoothstep(0.18, 0.05, length(cp - bgPointer()));
  float level = floor(v * 10.0);
  float scramble = floor(hash12(cell + floor(uTime * 18.0)) * 10.0);
  level = mix(level, max(scramble, 2.0), step(0.5, near * hash12(cell + floor(uTime * 6.0)) * 2.0));
  int bits = GLYPHS[int(level)];
  float on = 0.0;
  if (pix.x >= 0.0 && pix.x < 5.0 && pix.y >= 0.0 && pix.y < 5.0) on = float((bits >> int(pix.y * 5.0 + pix.x)) & 1);
  vec3 ink = mix(uColor0, uColor1, clamp(hue, 0.0, 1.0));
  fragColor = vec4(mix(uColor2, ink, on * (0.35 + 0.65 * v)), 1.0);
}`;

/** `colors`: [first glow, second glow, background]. */
export function GradientAscii({ rows = 22, ...props }: GradientAsciiProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) l c calc(h + 90))", "var(--pl-bg)"]}
      uniforms={{ uRows: rows }}
      {...props}
    />
  );
}
