// Hyperspeed: a night highway in perspective, with streaks of tail lights racing away on the left and head
// lights rushing in on the right. The pointer pans the camera. A WebGL2 shader on ShaderBackground (no 3D library).
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type HyperspeedProps = BackgroundProps & {
  /** Lanes in each direction (1 to 4). */
  lanes?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uLanes;
#define dk step(dot(uBg, vec3(0.299, 0.587, 0.114)), 0.5)
float trail(float x, float z, float lane, float dir, float fx) {
  float across = 1.0 - smoothstep(0.03, 0.03 + fx * 1.5, abs(abs(x - lane) - 0.16));
  float zz = z * 0.09 - dir * uTime * (0.9 + hash12(vec2(lane, 1.0)) * 0.6) + hash12(vec2(lane, 3.0));
  float id = floor(zz), f = fract(zz);
  float on = step(0.3, hash12(vec2(id, lane * 7.0)));
  float len = 0.2 + 0.35 * hash12(vec2(id, lane + 2.0));
  float seg = smoothstep(0.0, 0.03, f) * smoothstep(len, len * 0.4, f);
  return across * on * seg;
}
void main() {
  vec2 uv = bgUv();
  float hz = 0.12;
  vec3 col = uBg;
  col = mix(col, uColor0, exp(-abs(uv.y - hz) * 10.0) * 0.18);
  if (uv.y < hz) {
    float z = 0.3 / (hz - uv.y);
    float x = (uv.x - bgPointer().x * uPointerActive * 0.25) * z;
    float fx = fwidth(x);
    float n = clamp(floor(uLanes), 1.0, 4.0);
    float hw = n * 0.75;
    float fog = exp(-z * 0.05);
    float road = 1.0 - smoothstep(hw, hw + fx, abs(x));
    col = mix(col, mix(uBg, uFg, 0.05), road * 0.8);
    float mark = 0.0;
    for (float k = 0.0; k <= 4.0; k++) {
      if (k > n) break;
      float lx = k * 0.75;
      float m = 1.0 - smoothstep(0.02, 0.02 + fx * 1.5, abs(abs(x) - lx));
      mark += m * (k == 0.0 || k == n ? 1.0 : step(0.5, fract(z * 0.35 + uTime * 2.0)));
    }
    col = mix(col, uColor2, clamp(mark, 0.0, 1.0) * fog * 0.6);
    float outL = 0.0, inL = 0.0;
    for (float k = 0.0; k < 4.0; k++) {
      if (k >= n) break;
      float lx = 0.375 + k * 0.75;
      outL += trail(x, z, -lx, 1.0, fx);
      inL += trail(x, z, lx, -1.6, fx);
    }
    col = mix(col, uColor0, clamp(outL * fog * 1.4, 0.0, 1.0));
    col = mix(col, uColor1, clamp(inL * fog * 1.4, 0.0, 1.0));
    col += (outL * uColor0 + inL * uColor1) * fog * 0.4 * dk;
  }
  fragColor = vec4(col, 1.0);
}
`;

/** Colors: outgoing lights, incoming lights and lane markings (default: accent, accent light, muted foreground). */
export function Hyperspeed({ lanes = 3, ...props }: HyperspeedProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent)", "var(--pl-accent-300)", "var(--pl-fg-subtle)"]} uniforms={{ uLanes: lanes }} />;
}
