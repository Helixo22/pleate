// Iridescence: an oil on water sheen of folding interference bands, tinted by a color. The pointer shifts the
// pattern. A WebGL2 shader on ShaderBackground.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type IridescenceProps = BackgroundProps & {
  /** How strongly the pointer shifts the pattern. */
  amplitude?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uAmp;
void main() {
  vec2 uv = bgUv() * 2.0 + bgPointer() * uPointerActive * 0.4 * uAmp;
  float t = uTime * 0.25;
  float d = -t * 0.5, a = 0.0;
  for (float i = 0.0; i < 8.0; i++) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += t * 0.5;
  vec3 c = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  c = cos(c * cos(vec3(d, a, 2.5)) * 0.5 + 0.5);
  vec3 col = mix(c, c * (uColor0 * 0.9 + 0.3), 0.7);
  fragColor = vec4(mix(uBg, col, 0.9), 1.0);
}
`;

/** Colors: the tint (default: accent light). */
export function Iridescence({ amplitude = 1, ...props }: IridescenceProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent-300)"]} uniforms={{ uAmp: amplitude }} />;
}
