// Plasma: thick flowing color, folded over itself again and again. The flow bends towards the pointer.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (plasma); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [main, second]. */
export type PlasmaProps = BackgroundProps;

const FRAGMENT = `${BG_GLSL}
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime * 0.35;
  vec2 p = uv * 1.6;
  vec2 dm = m - uv;
  p += uPointerActive * 0.6 * dm * exp(-3.0 * length(dm));
  for (int i = 1; i < 6; i++) {
    float fi = float(i);
    p += vec2(0.7 / fi * sin(fi * p.y + t + 0.3 * fi), 0.7 / fi * cos(fi * p.x + t * 1.3 + 0.5 * fi));
  }
  float v = 0.5 + 0.5 * sin(p.x + p.y);
  float w = 0.5 + 0.5 * cos(p.x * 1.3 - p.y * 0.7 + t);
  vec3 col = mix(uColor0, uColor1, w);
  float a = smoothstep(0.1, 1.0, v) * 0.95;
  fragColor = vec4(col * a, a);
}`;

export function Plasma(props: PlasmaProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-accent)", "var(--pl-info)"]} {...props} />;
}
