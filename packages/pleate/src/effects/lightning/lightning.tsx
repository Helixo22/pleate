// Lightning: a flickering electric bolt crackling down the frame, with a soft glow around it. It follows the
// pointer across. A WebGL2 shader on ShaderBackground.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type LightningProps = BackgroundProps & {
  /** Brightness of the bolt and its glow. */
  intensity?: number;
  /** Horizontal position, -1 (left edge) to 1 (right edge). */
  x?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uIntensity; uniform float uX;
#define dk step(dot(uBg, vec3(0.299, 0.587, 0.114)), 0.5)
void main() {
  vec2 uv = bgUv();
  float ar = uResolution.x / uResolution.y;
  float x0 = mix(uX * 0.5 * ar / uScale, bgPointer().x, uPointerActive);
  float n = fbm(vec2(uv.y * 3.0, uTime * 1.3)) - 0.5;
  n += (fbm(vec2(uv.y * 14.0, uTime * 4.0)) - 0.5) * 0.25;
  float d = abs(uv.x - x0 - n * 0.55);
  float flick = 0.55 + 0.45 * vnoise(vec2(uTime * 14.0, 0.0));
  float i = 0.01 / (d + 0.002) * flick * uIntensity;
  i += exp(-abs(uv.x - x0) * 3.0) * 0.25 * flick * uIntensity;
  vec3 col = mix(uBg, uColor0, clamp(i, 0.0, 1.0));
  col += vec3(1.0) * clamp(0.002 / d, 0.0, 1.0) * flick * dk;
  col += (hash12(gl_FragCoord.xy) - 0.5) / 128.0;
  fragColor = vec4(col, 1.0);
}
`;

/** Colors: the bolt (default: accent light). */
export function Lightning({ intensity = 1, x = 0, ...props }: LightningProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent-300)"]} uniforms={{ uIntensity: intensity, uX: x }} />;
}
