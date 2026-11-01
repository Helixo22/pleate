// AeroShards: ribbons of thick glass shards streaming sideways on three depths, catching light along their edges,
// over a faint grid of survey markers. The pointer brightens the glass near it.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type AeroShardsProps = BackgroundProps;

const FRAGMENT = `${BG_GLSL}
vec3 glow(vec3 b, vec3 c, float a) { a = max(a, 0.0); float dark = step(dot(b, vec3(0.3, 0.59, 0.11)), 0.5); return mix(mix(b, c, min(a, 1.0)), b + c * a, dark); }
void main() {
  vec2 p = bgUv();
  vec2 m = bgPointer();
  vec3 col = uColor2;
  // Survey markers: small crosses on a coarse grid.
  vec2 gm = abs(fract(p * 3.0) - 0.5);
  float px = bgPx() * 3.0;
  float cross = (step(gm.x, px) + step(gm.y, px)) * step(max(gm.x, gm.y), 0.035);
  col = glow(col, uColor3, min(cross, 1.0) * 0.25);
  for (int i = 2; i >= 0; i--) {
    float fi = float(i);
    float depth = 1.0 + fi * 0.8;
    vec2 q = rot(0.35 - fi * 0.12) * p * (2.2 * depth);
    q.y += sin(q.x * 0.45 + uTime * 0.25 + fi * 2.0) * 0.7;
    q.x += uTime * (0.5 + fi * 0.15);
    float band = floor(q.y);
    if (hash12(vec2(band, fi * 7.0)) < 0.5) continue;
    vec2 cell = vec2(floor(q.x * 1.4), band);
    vec2 f = vec2(fract(q.x * 1.4), fract(q.y));
    float r1 = hash12(cell + fi * 13.0), r2 = hash12(cell + 7.31 + fi);
    float left = 0.08 + 0.3 * r1 + (f.y - 0.5) * (r2 - 0.5) * 0.9;
    float right = 0.92 - 0.3 * r2 + (f.y - 0.5) * (r1 - 0.5) * 0.9;
    float top = 0.2 + 0.15 * r2, bottom = 0.8 - 0.15 * r1;
    float e = min(min(f.x - left, right - f.x), min(f.y - top, bottom - f.y));
    float aa = px * depth * 1.2;
    float inside = smoothstep(0.0, aa, e);
    float edge = inside * (1.0 - smoothstep(0.0, 0.07, e));
    vec3 tint = mix(uColor0, uColor1, r1);
    float lit = 1.0 + 1.5 * uPointerActive * exp(-length(p - m) * 3.0);
    float fade = 1.0 / depth;
    col = mix(col, glow(col, tint, (0.25 + 0.2 * f.y) * lit), inside * fade);
    col = glow(col, mix(tint, vec3(1.0), 0.4), edge * 0.9 * lit * fade);
  }
  fragColor = vec4(col, 1.0);
}`;

/** `colors`: [glass, second glass, background, markers]. */
export function AeroShards(props: AeroShardsProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) l c calc(h + 60))", "var(--pl-bg)", "var(--pl-fg)"]} {...props} />;
}
