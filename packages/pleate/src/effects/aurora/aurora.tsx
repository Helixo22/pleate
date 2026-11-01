// Aurora: soft curtains of light that ripple across the top of the frame, with fine vertical rays. The pointer
// lifts the curtains above it.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type AuroraProps = BackgroundProps & {
  /** Brightness of the curtains, 0..2. */
  intensity?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uIntensity;
vec3 glow(vec3 b, vec3 c, float a) { a = max(a, 0.0); float dark = step(dot(b, vec3(0.3, 0.59, 0.11)), 0.5); return mix(mix(b, c, min(a, 1.0)), b + c * a, dark); }
void main() {
  vec2 p = bgUv();
  vec2 m = bgPointer();
  float t = uTime * 0.25;
  vec3 col = uColor3;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float x = p.x * 1.1 + fi * 1.7;
    float base = 0.05 + fi * 0.08 + 0.35 * (fbm(vec2(x * 0.7 + t * (0.6 + fi * 0.2), fi * 3.1 + t * 0.3)) - 0.5);
    base += 0.12 * uPointerActive * exp(-abs(p.x - m.x) * 3.0);
    float y = p.y - base;
    float curtain = smoothstep(-0.06, 0.02, y) * exp(-max(y, 0.0) * (5.0 - fi));
    curtain *= 0.55 + 0.45 * vnoise(vec2(x * 14.0, t * 2.0 + fi));
    vec3 c = i == 0 ? uColor0 : (i == 1 ? uColor1 : uColor2);
    col = glow(col, c, curtain * 0.6 * uIntensity);
  }
  fragColor = vec4(col, 1.0);
}`;

/** `colors`: [three curtain colors, background]. */
export function Aurora({ intensity = 1, ...props }: AuroraProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) l c calc(h - 70))", "oklch(from var(--pl-accent) l c calc(h + 60))", "var(--pl-bg)"]}
      uniforms={{ uIntensity: intensity }}
      {...props}
    />
  );
}
