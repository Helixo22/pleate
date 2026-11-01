// FaultyTerminal: a screen of pixel glyphs typed in ragged lines that keep rewriting themselves, with scanlines,
// flicker and rows that tear sideways now and then. The pointer brightens the text near it.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type FaultyTerminalProps = BackgroundProps & {
  /** Text rows across the frame height. */
  rows?: number;
  /** Glitch amount, 0..1. */
  glitch?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uRows;
uniform float uGlitch;
vec3 glow(vec3 b, vec3 c, float a) { a = max(a, 0.0); float dark = step(dot(b, vec3(0.3, 0.59, 0.11)), 0.5); return mix(mix(b, c, min(a, 1.0)), b + c * a, dark); }
void main() {
  vec2 fc = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 cs = vec2(0.62, 1.0) * uResolution.y / (uRows / uScale);
  float row = floor(fc.y / cs.y);
  float tear = step(1.0 - 0.04 * uGlitch, hash12(vec2(row, floor(uTime * 9.0))));
  fc.x += tear * (hash12(vec2(row, floor(uTime * 23.0))) - 0.5) * cs.x * 6.0;
  vec2 cell = floor(fc / cs);
  vec2 f = fract(fc / cs);
  vec2 pix = floor(f * vec2(6.0, 9.0));
  float inGlyph = step(pix.x, 4.0) * step(1.0, pix.y) * step(pix.y, 7.0);
  float epoch = floor(uTime * 0.4 + hash12(vec2(row, 1.0)) * 4.0);
  float cols = uResolution.x / cs.x;
  float lineLen = hash12(vec2(row, epoch)) * cols * 0.9;
  float typed = min(lineLen, (fract(uTime * 0.4 + hash12(vec2(row, 1.0)) * 4.0)) * cols * 1.6);
  float visible = step(cell.x, typed) * step(0.18, hash12(vec2(row, epoch + 0.5)));
  float seed = hash12(cell + floor(uTime * (0.5 + 2.0 * hash12(cell))));
  float mirrored = min(pix.x, 4.0 - pix.x);
  float bit = step(0.48, hash12(vec2(mirrored, pix.y) + seed * 91.7));
  float on = inGlyph * bit * visible;
  vec2 cp = ((cell + 0.5) * cs) / uResolution.y;
  vec2 mp = vec2(uPointer.x * uResolution.x, (1.0 - uPointer.y) * uResolution.y) / uResolution.y;
  float near = uPointerActive * exp(-length(cp - mp) * 5.0);
  float bright = (0.35 + 0.5 * hash12(cell + epoch) + near * 0.8) * (0.94 + 0.06 * sin(uTime * 50.0));
  vec3 col = glow(uColor1, uColor0, (on * bright + 0.05) * (0.8 + 0.2 * sin(gl_FragCoord.y * 1.6)));
  fragColor = vec4(col, 1.0);
}`;

/** `colors`: [text, background]. */
export function FaultyTerminal({ rows = 18, glitch = 0.5, ...props }: FaultyTerminalProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "var(--pl-bg)"]}
      uniforms={{ uRows: rows, uGlitch: glitch }}
      {...props}
    />
  );
}
