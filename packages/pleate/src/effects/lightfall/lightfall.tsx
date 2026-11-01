// Lightfall: thin streaks of light falling down in columns, each with a bright head and a fading tail. Columns
// near the pointer burn brighter. A WebGL2 shader on ShaderBackground.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type LightfallProps = BackgroundProps & {
  /** Share of columns with streaks, 0 to 1. */
  density?: number;
  /** Columns across the height of the canvas. */
  columns?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uDensity; uniform float uColumns;
#define dk step(dot(uBg, vec3(0.299, 0.587, 0.114)), 0.5)
void main() {
  vec2 st = gl_FragCoord.xy / uResolution.y / uScale;
  float x = st.x * uColumns;
  float id = floor(x), fx = fract(x) - 0.5;
  float h = hash12(vec2(id, 1.0));
  float s = st.y + uTime * (0.25 + h * 0.55);
  float cell = s * 0.7 + h * 7.0;
  float f = fract(cell);
  float on = step(1.0 - uDensity, hash12(vec2(id, floor(cell))));
  float tail = exp(-f * 4.5);
  float across = exp(-fx * fx * 90.0) + exp(-fx * fx * 900.0);
  float px = uPointer.x * uResolution.x / uResolution.y / uScale * uColumns;
  float near = 1.0 + 1.5 * uPointerActive * exp(-pow((x - px) / 3.0, 2.0));
  float i = on * tail * across * 0.75 * near;
  vec3 c = mix(uColor0, uColor1, h);
  vec3 col = mix(uBg, c, clamp(i, 0.0, 1.0));
  col += vec3(1.0) * on * exp(-f * 60.0) * exp(-fx * fx * 400.0) * 0.6 * dk;
  fragColor = vec4(col, 1.0);
}
`;

/** Colors: two colors the streaks mix between (default: accent and accent light). */
export function Lightfall({ density = 0.5, columns = 36, ...props }: LightfallProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent)", "var(--pl-accent-300)"]} uniforms={{ uDensity: density, uColumns: columns }} />;
}
