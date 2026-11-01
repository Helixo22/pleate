// Silk: slow folds of shiny fabric with a fine grain. The folds turn a little towards the pointer.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (silk); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [fabric, sheen]. */
export type SilkProps = BackgroundProps;

const FRAGMENT = `${BG_GLSL}
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime * 0.4;
  vec2 p = rot(-0.5 + uPointerActive * m.x * 0.4) * uv * 2.2;
  p.y += 0.08 * sin(p.x * 3.0 - t);
  float f = sin(p.x * 2.6 + sin(p.y * 1.8 + t) * 1.6 + t * 0.6 + 0.6 * sin(p.y * 4.0 - t * 0.7));
  float shade = 0.5 + 0.5 * f;
  float sheen = pow(shade, 8.0);
  float grain = (hash12(gl_FragCoord.xy + floor(uTime * 24.0)) - 0.5) * 0.06;
  vec3 col = mix(uColor0 * 0.18, uColor0, smoothstep(0.0, 1.0, shade)) + uColor1 * sheen * 0.25 + grain;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

export function Silk(props: SilkProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-accent)", "var(--pl-fg)"]} {...props} />;
}
