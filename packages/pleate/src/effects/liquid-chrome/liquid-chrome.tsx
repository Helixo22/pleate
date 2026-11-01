// LiquidChrome: a sheet of molten chrome folding over itself, with bright speculars. The pointer sends
// ripples through it. A WebGL2 shader on ShaderBackground.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type LiquidChromeProps = BackgroundProps & {
  /** Strength of the pointer ripples, 0 to turn them off. */
  ripple?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uRipple;
void main() {
  vec2 uv = bgUv() * 2.0;
  vec2 m = bgPointer() * 2.0;
  float dm = length(uv - m);
  uv += (uv - m) / max(dm, 1e-3) * sin(dm * 16.0 - uTime * 5.0) * 0.05 * uRipple * uPointerActive * exp(-dm * 1.5);
  float t = uTime * 0.35;
  for (float i = 1.0; i < 8.0; i++) {
    uv.x += 0.55 / i * cos(i * 2.3 * uv.y + t);
    uv.y += 0.55 / i * cos(i * 1.6 * uv.x + t);
  }
  float v = abs(sin(t - uv.y - uv.x));
  float s = pow(v, 1.6);
  float spec = pow(v, 22.0);
  vec3 col = mix(uColor1, uColor0, s) + spec * 0.45;
  fragColor = vec4(mix(uBg, col, 0.92), 1.0);
}
`;

/** Colors: highlight and shadow tones (default: accent lightest and accent deepest). */
export function LiquidChrome({ ripple = 1, ...props }: LiquidChromeProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent-100)", "var(--pl-accent-950)"]} uniforms={{ uRipple: ripple }} />;
}
