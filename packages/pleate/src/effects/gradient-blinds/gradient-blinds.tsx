// GradientBlinds: a slow flowing gradient seen through a row of folded blinds, with a soft spotlight that
// follows the pointer. A WebGL2 shader on ShaderBackground: fills its parent, decorative, pauses off screen and
// draws one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type GradientBlindsProps = BackgroundProps & {
  /** Number of blinds across the height of the canvas. */
  blinds?: number;
  /** Tilt of the blinds in degrees. */
  angle?: number;
  /** Strength of the pointer spotlight, 0 to turn it off. */
  spotlight?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uBlinds; uniform float uAngle; uniform float uSpot;
void main() {
  vec2 uv = bgUv();
  vec2 q = rot(uAngle) * uv;
  float x = q.x * uBlinds;
  float slat = floor(x), f = fract(x);
  float g = fbm(vec2(slat * 0.12 + uTime * 0.05, q.y * 0.7 - uTime * 0.08));
  float t = clamp(0.5 + q.x * 0.35 + (g - 0.5) * 1.6, 0.0, 1.0);
  vec3 col = mix(uColor0, uColor1, smoothstep(0.0, 0.55, t));
  col = mix(col, uColor2, smoothstep(0.5, 1.0, t));
  float fold = 0.62 + 0.38 * sin(f * 3.14159);
  fold += 0.18 * smoothstep(0.82, 1.0, f) - 0.12 * smoothstep(0.12, 0.0, f);
  vec2 d = uv - bgPointer();
  float spot = exp(-dot(d, d) * 5.0) * uPointerActive * uSpot;
  col = col * fold + spot * (uColor0 * 0.6 + 0.25);
  fragColor = vec4(mix(uBg, col, 0.88), 1.0);
}
`;

/** Colors: light, mid and deep stops of the gradient (default: the accent ramp). */
export function GradientBlinds({ blinds = 14, angle = 0, spotlight = 0.5, ...props }: GradientBlindsProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent-300)", "var(--pl-accent)", "var(--pl-accent-900)"]} uniforms={{ uBlinds: blinds, uAngle: (angle * Math.PI) / 180, uSpot: spotlight }} />;
}
