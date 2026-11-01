// SoftAurora: soft curtains of light drifting across the top of the frame. They glow brighter near the
// pointer.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (soft-aurora); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [low, mid, high]. */
export type SoftAuroraProps = BackgroundProps;

const FRAGMENT = `${BG_GLSL}
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime * 0.25;
  vec3 col = vec3(0.0); float a = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float yc = 0.02 + fi * 0.09 + 0.12 * sin(uv.x * 1.3 + t * (1.0 + fi * 0.3) + fi * 2.0) + 0.15 * (fbm(vec2(uv.x * 1.1 + t * 0.4, fi * 3.1)) - 0.5);
    float d = uv.y - yc;
    float band = d > 0.0 ? exp(-d * (5.0 + fi * 2.0)) : exp(d * 28.0);
    float curtain = 0.55 + 0.45 * fbm(vec2(uv.x * 9.0 + t * 1.5 + fi * 5.0, uv.y * 0.6));
    float g = band * curtain * (0.55 + 0.45 * uPointerActive * exp(-length(uv - m) * 3.0));
    vec3 c = i == 0 ? uColor0 : (i == 1 ? uColor1 : uColor2);
    col += c * g * 0.6; a += g * 0.6;
  }
  a = min(a, 1.0);
  fragColor = vec4(min(col, vec3(a)), a);
}`;

export function SoftAurora(props: SoftAuroraProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-success)", "var(--pl-accent)", "var(--pl-info)"]} {...props} />;
}
