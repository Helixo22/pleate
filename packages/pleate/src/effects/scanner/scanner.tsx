// Scanner: a bright beam slides back and forth over a dot matrix, waking the dots it passes. Hover to
// steer the beam.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (scanner); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [beam, dots]. */
export type ScannerProps = BackgroundProps;

const FRAGMENT = `${BG_GLSL}
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime * 0.7, px = bgPx();
  float half_ = 0.5 * uResolution.x / uResolution.y / uScale;
  float bx = mix(sin(t) * half_ * 0.85, m.x, uPointerActive);
  float d = uv.x - bx;
  float beam = 1.5 * px / (abs(d) + 1.5 * px) + 0.25 * exp(-abs(d) * 12.0);
  vec2 g = uv * 28.0;
  vec2 id = floor(g);
  float flick = hash12(id + floor(uTime * 6.0));
  float dotMask = smoothstep(0.22, 0.12, length(fract(g) - 0.5));
  float wake = exp(-abs(d) * 7.0) * (0.5 + 0.5 * flick);
  float dots = dotMask * (0.1 + wake);
  vec3 col = uColor0 * beam + mix(uColor1, uColor0, wake) * dots;
  float a = min(beam + dots, 1.0);
  fragColor = vec4(min(col, vec3(a)), a);
}`;

export function Scanner(props: ScannerProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-accent)", "var(--pl-fg)"]} {...props} />;
}
