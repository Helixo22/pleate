// MagicRings: concentric glowing rings that wobble and pulse, each with a bright arc spinning around it. The
// pointer pulls the center. A WebGL2 shader on ShaderBackground.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type MagicRingsProps = BackgroundProps & {
  /** Number of rings (1 to 10). */
  rings?: number;
  /** Glow strength. */
  glow?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uRings; uniform float uGlow;
#define dk step(dot(uBg, vec3(0.299, 0.587, 0.114)), 0.5)
void main() {
  vec2 uv = bgUv() - bgPointer() * uPointerActive * 0.25;
  float r = length(uv), a = atan(uv.y, uv.x);
  float n = clamp(floor(uRings), 1.0, 10.0);
  float total = 0.0;
  vec3 acc = vec3(0.0);
  for (float k = 0.0; k < 10.0; k++) {
    if (k >= n) break;
    float rr = 0.08 + k * 0.06 + 0.008 * sin(a * 3.0 + uTime * (1.0 + k * 0.3) + k);
    float d = abs(r - rr);
    float dir = mod(k, 2.0) * 2.0 - 1.0;
    float arc = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(a + dir * uTime * (0.6 + k * 0.15) + k * 1.3), 4.0);
    float g = 0.003 / (d + 0.0025) * arc * uGlow;
    vec3 c = mix(uColor0, uColor1, n > 1.0 ? k / (n - 1.0) : 0.0);
    total += g;
    acc += c * g;
  }
  vec3 c = acc / max(total, 1e-4);
  float i = total * 0.6;
  vec3 col = mix(uBg, c, clamp(i, 0.0, 1.0));
  col += c * max(i - 1.0, 0.0) * 0.2 * dk;
  fragColor = vec4(col, 1.0);
}
`;

/** Colors: inner and outer rings (default: accent light and accent). */
export function MagicRings({ rings = 6, glow = 1, ...props }: MagicRingsProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent-300)", "var(--pl-accent)"]} uniforms={{ uRings: rings, uGlow: glow }} />;
}
