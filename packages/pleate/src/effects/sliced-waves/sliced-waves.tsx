// SlicedWaves: a wave pattern cut into horizontal strips, each strip sliding on its own. Strips near the
// pointer slide further.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (sliced-waves); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [low, high]. */
export type SlicedWavesProps = BackgroundProps & {
  /** Number of strips. */
  slices?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uSlices;
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime * 0.8;
  float y = uv.y * uScale + 0.5;
  float id = floor(y * uSlices);
  float yc = (id + 0.5) / uSlices - 0.5;
  float push = uPointerActive * exp(-pow((yc / uScale - m.y) * 5.0, 2.0)) * 0.35;
  float x = uv.x + sin(id * 0.9 + t) * 0.25 + push;
  float v = 0.5 + 0.5 * sin(x * 6.0 + id * 0.45 - t * 1.4);
  float gap = smoothstep(0.0, 0.08, fract(y * uSlices)) * smoothstep(1.0, 0.92, fract(y * uSlices));
  vec3 col = mix(uColor0, uColor1, v);
  float a = mix(0.12, 0.95, smoothstep(0.15, 1.0, v)) * gap;
  fragColor = vec4(col * a, a);
}`;

export function SlicedWaves({ slices = 14, ...props }: SlicedWavesProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-accent)", "var(--pl-info)"]} uniforms={{ uSlices: slices }} {...props} />;
}
