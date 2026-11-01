// PatternWaves: a halftone grid whose marks swell and shrink as waves pass through. The pointer adds a
// swell of its own.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (pattern-waves); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [small marks, large marks]. */
export type PatternWavesProps = BackgroundProps & {
  /** Mark shape. */
  pattern?: "dots" | "squares" | "lines";
};

const FRAGMENT = `${BG_GLSL}
uniform float uPattern;
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime, px = bgPx();
  float g = 26.0;
  vec2 p = uv * g;
  vec2 id = floor(p) + 0.5, f = p - id;
  vec2 c = id / g;
  float w = 0.5 + 0.5 * sin(c.x * 4.0 + t * 1.4 + sin(c.y * 3.0 + t * 0.8) * 1.5);
  w = max(w, uPointerActive * exp(-length(c - m) * 6.0));
  float r = 0.06 + 0.36 * w;
  float aa = px * g * 1.5;
  float d = uPattern < 0.5 ? length(f) : (uPattern < 1.5 ? max(abs(f.x), abs(f.y)) : abs(f.y) + step(0.48, abs(f.x)));
  float mark = smoothstep(r, r - aa, uPattern > 1.5 ? d * 2.2 : d);
  vec3 col = mix(uColor0, uColor1, w);
  float a = mark * (0.25 + 0.65 * w);
  fragColor = vec4(col * a, a);
}`;

export function PatternWaves({ pattern = "dots", ...props }: PatternWavesProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-fg)", "var(--pl-accent)"]} uniforms={{ uPattern: pattern === "squares" ? 1 : pattern === "lines" ? 2 : 0 }} {...props} />;
}
