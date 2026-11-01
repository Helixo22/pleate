// DarkVeil: a slow, smoky veil of tinted light folding over itself (domain warped noise), with faint scanlines.
// The pointer stirs the smoke near it.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type DarkVeilProps = BackgroundProps & {
  /** Strength of the scanlines, 0..1. */
  scanlines?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uScan;
vec3 glow(vec3 b, vec3 c, float a) { a = max(a, 0.0); float dark = step(dot(b, vec3(0.3, 0.59, 0.11)), 0.5); return mix(mix(b, c, min(a, 1.0)), b + c * a, dark); }
void main() {
  vec2 p = bgUv() * 1.5;
  vec2 m = bgPointer() * 1.5;
  p += (p - m) * 0.25 * uPointerActive * exp(-length(p - m) * 2.0);
  float t = uTime * 0.1;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.5 * q + vec2(1.7, 9.2) + t * 1.5), fbm(p + 3.5 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 3.5 * r);
  vec3 c = mix(uColor0, uColor1, clamp(q.x * 1.4 - 0.2, 0.0, 1.0));
  float a = smoothstep(0.25, 0.95, f);
  vec3 col = glow(uColor2, c, a * a * 1.3);
  col *= 1.0 - uScan * 0.12 * (0.5 + 0.5 * sin(gl_FragCoord.y * 2.0));
  fragColor = vec4(col, 1.0);
}`;

/** `colors`: [veil, second veil, background]. */
export function DarkVeil({ scanlines = 0.5, ...props }: DarkVeilProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) l c calc(h + 50))", "var(--pl-bg)"]}
      uniforms={{ uScan: scanlines }}
      {...props}
    />
  );
}
