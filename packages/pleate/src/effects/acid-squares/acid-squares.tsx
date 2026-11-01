// AcidSquares: a rolling field of glossy rounded squares. A slow wave lifts and tilts each tile, two colored lights
// drift across the field and catch the tiles' bevels, and the pointer swells the tiles under it.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type AcidSquaresProps = BackgroundProps;

const FRAGMENT = `${BG_GLSL}
void main() {
  vec2 p = bgUv();
  float n = 9.0;
  vec2 g = p * n;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  vec2 c = (id + 0.5) / n;
  float t = uTime;
  float a1 = id.x * 0.45 + t * 1.3, a2 = id.y * 0.38 - t * 1.0, a3 = (id.x + id.y) * 0.22 + t * 0.6;
  float wave = (sin(a1) + sin(a2) + sin(a3)) / 3.0;
  float near = uPointerActive * exp(-length(c - bgPointer()) * 4.0);
  float size = 0.3 + 0.1 * wave + 0.12 * near;
  vec2 d = abs(f) - size + 0.08;
  float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - 0.08;
  float aa = n * bgPx() * 1.5;
  float mask = smoothstep(aa, -aa, sd);
  // Bevel: the normal tips toward the tile's edge, plus the wave's tilt.
  vec2 bevel = f * smoothstep(-0.12, 0.0, sd) * 3.0;
  vec3 nrm = normalize(vec3(bevel + 0.6 * vec2(cos(a1), cos(a2)), 1.0));
  vec2 l1 = vec2(sin(t * 0.31), cos(t * 0.23)) * 0.7;
  vec2 l2 = vec2(cos(t * 0.27 + 2.0), sin(t * 0.33 + 1.0)) * 0.7;
  float i1 = exp(-length(c - l1) * 2.0), i2 = exp(-length(c - l2) * 2.0);
  vec3 hue = (uColor0 * i1 + uColor1 * i2) / max(i1 + i2, 1e-3);
  float lum = (i1 + i2) * (0.45 + 0.55 * nrm.z) * (0.7 + 0.3 * wave);
  float spec = pow(max(dot(nrm, normalize(vec3(0.4, 0.6, 1.0))), 0.0), 28.0) * (i1 + i2);
  float dark = step(dot(uColor2, vec3(0.3, 0.59, 0.11)), 0.5);
  // Dark: lit tiles glow. Light: tiles are tinted glass, darker on the shaded side.
  vec3 tile = mix(mix(uColor2, hue, clamp(0.12 + lum * 0.8, 0.0, 1.0)) * (0.85 + 0.15 * nrm.z), hue * lum + spec * 0.8 + uColor2 * 0.08, dark);
  fragColor = vec4(mix(uColor2, tile, mask), 1.0);
}`;

/** `colors`: [first light, second light, background]. */
export function AcidSquares(props: AcidSquaresProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) l c calc(h + 140))", "var(--pl-bg)"]} {...props} />;
}
