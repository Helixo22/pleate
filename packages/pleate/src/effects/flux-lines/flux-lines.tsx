// FluxLines: glowing contour lines tracing a churning field, like iron filings in moving magnetic fluid. The pointer
// acts as a magnet: it lights up the lines around it and curls them into a dipole.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type FluxLinesProps = BackgroundProps & {
  /** Line count multiplier. */
  density?: number;
  /** Brightness of lines away from the pointer, 0..1. */
  ambient?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uDensity;
uniform float uAmbient;
vec3 glow(vec3 b, vec3 c, float a) { a = max(a, 0.0); float dark = step(dot(b, vec3(0.3, 0.59, 0.11)), 0.5); return mix(mix(b, c, min(a, 1.0)), b + c * a, dark); }
void main() {
  vec2 p = bgUv() * 1.6;
  float t = uTime * 0.12;
  vec2 w = vec2(fbm(p + t), fbm(p + vec2(3.1, 7.7) - t));
  float f = fbm(p * 1.2 + w * 1.5);
  vec2 d = p - bgPointer() * 1.6;
  f += uPointerActive * 0.08 * d.y / (dot(d, d) + 0.06);
  float v = f * 14.0 * uDensity;
  float fw = max(fwidth(v), 1e-4);
  float dd = abs(fract(v + 0.5) - 0.5);
  float line = smoothstep(fw * 1.5, 0.0, dd) + 0.35 * exp(-dd / (fw * 3.0));
  float reveal = uAmbient + (1.0 - uAmbient) * uPointerActive * exp(-length(d) * 1.4);
  vec3 c = mix(uColor0, uColor1, smoothstep(0.3, 0.7, f));
  fragColor = vec4(glow(uColor2, c, line * reveal), 1.0);
}`;

/** `colors`: [line, second line, background]. */
export function FluxLines({ density = 1, ambient = 0.45, ...props }: FluxLinesProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) l c calc(h + 70))", "var(--pl-bg)"]}
      uniforms={{ uDensity: density, uAmbient: ambient }}
      {...props}
    />
  );
}
