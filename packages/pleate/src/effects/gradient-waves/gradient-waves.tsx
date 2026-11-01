// GradientWaves: stacked soft waves rolling across the bottom of the frame, each a step of a gradient. The
// pointer lifts the crests under it. A WebGL2 shader on ShaderBackground.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type GradientWavesProps = BackgroundProps & {
  /** Number of wave layers (1 to 8). */
  waves?: number;
  /** How far up the back wave reaches, 0 to 1. */
  height?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uWaves; uniform float uHeight;
void main() {
  vec2 st = gl_FragCoord.xy / uResolution;
  float ar = uResolution.x / uResolution.y;
  vec3 col = uBg;
  float n = clamp(uWaves, 1.0, 8.0);
  for (int i = 7; i >= 0; i--) {
    float fi = float(i);
    if (fi >= n) continue;
    float k = n > 1.0 ? fi / (n - 1.0) : 0.0;
    float x = st.x * ar / uScale;
    float y = 0.08 + k * (uHeight - 0.08);
    y += 0.05 * sin(x * (2.2 + fi * 0.45) + uTime * (0.5 + fi * 0.12) + fi * 1.7);
    y += 0.025 * sin(x * 5.3 - uTime * 0.7 + fi * 2.3);
    y += 0.08 * uPointerActive * exp(-pow((st.x - uPointer.x) * ar * 3.0, 2.0));
    float below = smoothstep(y + 1.5 / uResolution.y, y - 1.5 / uResolution.y, st.y);
    vec3 c = k < 0.5 ? mix(uColor0, uColor1, k * 2.0) : mix(uColor1, uColor2, k * 2.0 - 1.0);
    c *= 0.82 + 0.3 * smoothstep(y - 0.3, y, st.y);
    col = mix(col, mix(uBg, c, 0.92), below);
  }
  fragColor = vec4(col, 1.0);
}
`;

/** Colors: front, middle and back waves (default: the accent ramp). */
export function GradientWaves({ waves = 5, height = 0.7, ...props }: GradientWavesProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent-900)", "var(--pl-accent)", "var(--pl-accent-300)"]} uniforms={{ uWaves: waves, uHeight: height }} />;
}
