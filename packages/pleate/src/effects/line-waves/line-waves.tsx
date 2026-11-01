// LineWaves: a stack of thin horizontal lines undulating like a sound wave, shading from one color to another.
// The pointer parts the lines around it. A WebGL2 shader on ShaderBackground.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type LineWavesProps = BackgroundProps & {
  /** Number of lines. */
  lines?: number;
  /** Height of the waves. */
  amplitude?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uLines; uniform float uAmp;
float disp(float x, float k) {
  return (sin(x * 2.6 + uTime * 0.9 + k * 0.22) * 0.6 + (vnoise(vec2(x * 1.7 + uTime * 0.25, k * 0.09)) - 0.5) * 2.4) * uAmp;
}
void main() {
  vec2 st = gl_FragCoord.xy / uResolution;
  float ar = uResolution.x / uResolution.y;
  float x = st.x * ar / uScale;
  float y = st.y * uLines;
  vec2 d = (st - uPointer) * vec2(ar, 1.0);
  float push = uPointerActive * exp(-dot(d, d) * 14.0) * 2.5;
  float py = uPointer.y * uLines;
  float a = 0.0, kk = 0.0;
  for (int j = -3; j <= 3; j++) {
    float k = floor(y) + float(j);
    float yl = k + 0.5 + disp(x, k) + push * sign(k + 0.5 - py);
    float px = abs(y - yl) * uResolution.y / uLines;
    float m = 1.0 - smoothstep(0.5, 1.6, px);
    if (m > a) { a = m; kk = k; }
  }
  vec3 c = mix(uColor0, uColor1, clamp(kk / uLines, 0.0, 1.0));
  fragColor = vec4(mix(uBg, c, a * 0.9), 1.0);
}
`;

/** Colors: bottom and top lines (default: accent and accent light). */
export function LineWaves({ lines = 28, amplitude = 1, ...props }: LineWavesProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent)", "var(--pl-accent-300)"]} uniforms={{ uLines: lines, uAmp: amplitude }} />;
}
