// LightRays: shafts of light fanning out from a point above the frame, flickering slowly, and bending towards
// the pointer. A WebGL2 shader on ShaderBackground.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type LightRaysProps = BackgroundProps & {
  /** Horizontal position of the light source, 0 (left) to 1 (right). */
  originX?: number;
  /** Width of the fan of rays. */
  spread?: number;
  /** How far the rays reach (in canvas heights). */
  length?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uOrigin; uniform float uSpread; uniform float uLength;
#define dk step(dot(uBg, vec3(0.299, 0.587, 0.114)), 0.5)
void main() {
  float ar = uResolution.x / uResolution.y;
  vec2 st = gl_FragCoord.xy / uResolution.y;
  vec2 o = vec2(uOrigin * ar, 1.15);
  vec2 d = st - o;
  float len = length(d);
  float ang = atan(d.x, -d.y);
  vec2 pd = vec2(uPointer.x * ar, uPointer.y) - o;
  float aim = mix(0.0, atan(pd.x, -pd.y), uPointerActive * 0.7);
  float cone = exp(-pow((ang - aim) / (0.55 * uSpread), 2.0));
  float a = ang * 9.0 / uScale;
  float r = 0.5 + 0.25 * sin(a * 1.7 + uTime * 0.6) + 0.25 * sin(a * 3.1 - uTime * 0.45);
  r = r * 0.6 + 0.6 * vnoise(vec2(a * 2.0, uTime * 0.25));
  float i = pow(clamp(r, 0.0, 1.2), 2.5) * cone * (1.0 - smoothstep(0.0, uLength, len)) * 1.3;
  i += exp(-len * 4.0) * 0.5;
  vec3 col = mix(uBg, uColor0, clamp(i, 0.0, 1.0));
  col += uColor0 * max(i - 1.0, 0.0) * 0.3 * dk;
  col += (hash12(gl_FragCoord.xy) - 0.5) / 128.0;
  fragColor = vec4(col, 1.0);
}
`;

/** Colors: the light (default: accent light). */
export function LightRays({ originX = 0.5, spread = 1, length = 1.2, ...props }: LightRaysProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent-300)"]} uniforms={{ uOrigin: originX, uSpread: spread, uLength: length }} />;
}
