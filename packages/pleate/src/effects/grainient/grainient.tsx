// Grainient: a slow, domain warped gradient of three colors with film grain on top. The pointer nudges the
// flow. A WebGL2 shader on ShaderBackground.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type GrainientProps = BackgroundProps & {
  /** Grain strength, 0 to turn it off. */
  grain?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uGrain;
void main() {
  vec2 uv = bgUv() * 1.3;
  float t = uTime * 0.07;
  vec2 p = bgPointer() * uPointerActive * 0.35;
  vec2 w = vec2(fbm(uv + t + p), fbm(uv - t + vec2(5.2, 1.3) - p));
  float n = fbm(uv * 1.2 + w * 2.0 + t);
  vec3 col = mix(uColor0, uColor1, smoothstep(0.3, 0.62, n));
  col = mix(col, uColor2, smoothstep(0.45, 0.8, w.x));
  col += (hash12(gl_FragCoord.xy + fract(uTime * 7.0) * 113.0) - 0.5) * uGrain;
  fragColor = vec4(mix(uBg, col, 0.9), 1.0);
}
`;

/** Colors: three gradient colors (default: accent light, accent, accent deep). */
export function Grainient({ grain = 0.08, ...props }: GrainientProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent-300)", "var(--pl-accent)", "var(--pl-accent-900)"]} uniforms={{ uGrain: grain }} />;
}
