// Galaxy: several layers of twinkling stars turning slowly around the center over a faint colored nebula. The
// pointer shifts the layers by depth (parallax).
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type GalaxyProps = BackgroundProps & {
  /** Star density multiplier. */
  density?: number;
  /** Nebula strength, 0..1. */
  nebula?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uDensity;
uniform float uNebula;
vec3 glow(vec3 b, vec3 c, float a) { a = max(a, 0.0); float dark = step(dot(b, vec3(0.3, 0.59, 0.11)), 0.5); return mix(mix(b, c, min(a, 1.0)), b + c * a, dark); }
void main() {
  vec2 p = bgUv();
  vec2 shift = (uPointer - 0.5) * uPointerActive;
  float neb = fbm(rot(uTime * 0.01) * p * 1.8 + 3.0);
  vec3 col = glow(uColor2, mix(uColor0, uColor1, neb), smoothstep(0.45, 0.85, neb) * 0.35 * uNebula);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float sc = mix(16.0, 5.0, fi / 3.0) * uDensity;
    vec2 q = rot(uTime * 0.015 * (1.0 + fi * 0.4)) * (p - shift * 0.04 * (fi + 1.0)) * sc + fi * 13.1;
    vec2 id = floor(q);
    vec2 f = fract(q) - 0.5;
    vec2 h = hash22(id + fi * 7.0);
    float d = length(f - (h - 0.5) * 0.7);
    float size = mix(0.015, 0.05, h.x * h.y) * (1.0 + fi * 0.3);
    float tw = 0.55 + 0.45 * sin(uTime * (1.0 + h.x * 3.0) + h.y * 6.283);
    float star = (smoothstep(size, 0.0, d) + 0.004 / (d * d + 0.004) * 0.15 * step(0.8, h.x)) * tw * step(0.3, h.y);
    col = glow(col, mix(uColor3, uColor0, h.x * 0.7), star);
  }
  fragColor = vec4(col, 1.0);
}`;

/** `colors`: [star tint, nebula, background, stars]. */
export function Galaxy({ density = 1, nebula = 0.6, ...props }: GalaxyProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) l c calc(h + 60))", "var(--pl-bg)", "var(--pl-fg)"]}
      uniforms={{ uDensity: density, uNebula: nebula }}
      {...props}
    />
  );
}
