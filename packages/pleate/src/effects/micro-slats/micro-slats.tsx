// MicroSlats: a wall of very thin vertical slats tilting in slow waves, catching the light as they turn. The
// pointer flips the slats under it. A WebGL2 shader on ShaderBackground.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type MicroSlatsProps = BackgroundProps & {
  /** Number of slats across the width. */
  slats?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uSlats;
void main() {
  vec2 st = gl_FragCoord.xy / uResolution;
  float ar = uResolution.x / uResolution.y;
  float x = st.x * uSlats / uScale;
  float id = floor(x), f = fract(x);
  float ang = sin(id * 0.16 + uTime * 1.1) * 0.5 + (vnoise(vec2(id * 0.1, uTime * 0.35 + st.y * 1.3)) - 0.5) * 1.6;
  vec2 d = (vec2((id + 0.5) / uSlats * uScale, st.y) - uPointer) * vec2(ar, 1.0);
  ang += uPointerActive * 1.4 * exp(-dot(d, d) * 18.0);
  float face = abs(cos(ang)) * 0.42;
  float aa = uSlats / uScale / uResolution.x;
  float slat = 1.0 - smoothstep(face - aa, face + aa, abs(f - 0.5));
  float lit = pow(0.5 + 0.5 * sin(ang + 0.6), 2.0);
  float spec = pow(max(0.0, 1.0 - abs(ang - 0.5) * 2.5), 10.0) * 0.5;
  vec3 c = mix(uColor1, uColor0, lit) + spec;
  c *= 0.85 + 0.15 * st.y;
  fragColor = vec4(mix(uBg, c, slat * 0.95), 1.0);
}
`;

/** Colors: lit and shaded faces (default: accent light and accent deep). */
export function MicroSlats({ slats = 90, ...props }: MicroSlatsProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent-300)", "var(--pl-accent-800)"]} uniforms={{ uSlats: slats }} />;
}
