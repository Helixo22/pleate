// LightTunnel: flying down a tunnel of light rings and streaks, colors shifting with depth. The pointer moves
// the vanishing point. A WebGL2 shader on ShaderBackground.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type LightTunnelProps = BackgroundProps & {
  /** Ring density. */
  rings?: number;
  /** Light streaks around the tunnel. */
  segments?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uRings; uniform float uSegments;
#define dk step(dot(uBg, vec3(0.299, 0.587, 0.114)), 0.5)
void main() {
  vec2 uv = bgUv() - bgPointer() * uPointerActive * 0.3;
  float r = length(uv), a = atan(uv.y, uv.x);
  float z = 0.35 / max(r, 1e-3) + uTime * 1.2;
  float ring = pow(0.5 + 0.5 * cos(z * 6.2831 * uRings * 1.5), 6.0);
  float seg = pow(0.5 + 0.5 * cos(a * uSegments + z * 0.6), 8.0);
  float fade = smoothstep(0.03, 0.35, r);
  float i = (ring * 0.9 + seg * 0.5) * fade * smoothstep(1.4, 0.2, r);
  vec3 c = mix(uColor0, uColor1, 0.5 + 0.5 * sin(z * 0.4));
  float core = exp(-r * 7.0) * 0.8;
  vec3 col = mix(uBg, c, clamp(i, 0.0, 1.0));
  col = mix(col, uColor1, clamp(core, 0.0, 1.0));
  col += c * i * 0.3 * dk;
  fragColor = vec4(col, 1.0);
}
`;

/** Colors: near and far colors (default: accent and accent light). */
export function LightTunnel({ rings = 1, segments = 12, ...props }: LightTunnelProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent)", "var(--pl-accent-300)"]} uniforms={{ uRings: rings, uSegments: segments }} />;
}
