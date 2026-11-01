// Topography: contour lines of rolling terrain that slowly shifts. Every fifth line is an index line; the
// pointer raises a hill.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (topography); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [lines, index lines]. */
export type TopographyProps = BackgroundProps;

const FRAGMENT = `${BG_GLSL}
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime * 0.05;
  float h = fbm(uv * 1.6 + vec2(t, t * 0.6)) + uPointerActive * 0.3 * exp(-dot(uv - m, uv - m) * 18.0);
  float lv = h * 16.0;
  float d = abs(fract(lv + 0.5) - 0.5);
  float w = fwidth(lv);
  float line = 1.0 - smoothstep(0.0, w * 1.3, d);
  float major = 1.0 - step(0.5, abs(mod(floor(lv + 0.5), 5.0)));
  vec3 col = mix(uColor0, uColor1, major);
  float a = line * mix(0.28, 0.85, major);
  fragColor = vec4(col * a, a);
}`;

export function Topography(props: TopographyProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-fg)", "var(--pl-accent)"]} {...props} />;
}
