// LightPillar: a tall shaft of light with drifting haze inside, fading between two colors from top to bottom.
// It leans towards the pointer. A WebGL2 shader on ShaderBackground.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type LightPillarProps = BackgroundProps & {
  /** Width multiplier of the pillar. */
  width?: number;
  /** Brightness of the glow. */
  intensity?: number;
  /** Rotation of the pillar in degrees. */
  rotation?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uWidth; uniform float uIntensity; uniform float uRotation;
#define dk step(dot(uBg, vec3(0.299, 0.587, 0.114)), 0.5)
void main() {
  vec2 uv = rot(uRotation) * bgUv();
  float x = uv.x - bgPointer().x * uPointerActive * 0.35 * (0.5 + uv.y);
  x += (fbm(vec2(uv.y * 2.0 - uTime * 0.4, uTime * 0.1)) - 0.5) * 0.12;
  float w = 0.05 * uWidth;
  float d = abs(x);
  float haze = 0.55 + 0.7 * fbm(vec2(x * 7.0, uv.y * 1.4 - uTime * 0.5));
  float i = w / (d + w * 0.3) * 0.32 * haze * uIntensity * (1.0 - 0.35 * abs(uv.y));
  vec3 c = mix(uColor1, uColor0, smoothstep(-0.5, 0.5, uv.y));
  vec3 col = mix(uBg, c, clamp(i, 0.0, 1.0));
  col += c * max(i - 1.0, 0.0) * 0.25 * dk;
  col += vec3(1.0) * (1.0 - smoothstep(0.0, w * 0.45, d)) * 0.5 * dk;
  col += (hash12(gl_FragCoord.xy) - 0.5) / 128.0;
  fragColor = vec4(col, 1.0);
}
`;

/** Colors: top and bottom of the pillar (default: accent light and accent). */
export function LightPillar({ width = 1, intensity = 1, rotation = 0, ...props }: LightPillarProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent-300)", "var(--pl-accent)"]} uniforms={{ uWidth: width, uIntensity: intensity, uRotation: (rotation * Math.PI) / 180 }} />;
}
