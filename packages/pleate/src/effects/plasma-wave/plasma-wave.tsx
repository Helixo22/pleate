// PlasmaWave: a few glowing waveforms that cross and breathe. The lines lean towards the pointer.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (plasma-wave); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [first line, last line]. */
export type PlasmaWaveProps = BackgroundProps & {
  /** Number of waveforms (1 to 8). */
  lines?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uLines;
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime * 0.8, px = bgPx();
  vec3 col = vec3(0.0); float a = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    if (fi >= uLines) break;
    float k = uLines > 1.0 ? fi / (uLines - 1.0) : 0.0;
    float y = 0.16 * sin(uv.x * (1.5 + fi * 0.33) + t * (1.0 + fi * 0.17) + fi * 1.7) * (1.0 + 0.4 * sin(t * 0.5 + fi));
    y += uPointerActive * (m.y - y) * 0.6 * exp(-pow((uv.x - m.x) * 2.5, 2.0));
    float d = abs(uv.y - y);
    float g = 1.6 * px / (d + 1.6 * px) * 0.8 + 0.12 * exp(-d * 14.0);
    vec3 c = mix(uColor0, uColor1, k);
    col += c * g; a += g;
  }
  a = min(a, 1.0);
  fragColor = vec4(min(col, vec3(a)), a);
}`;

export function PlasmaWave({ lines = 5, ...props }: PlasmaWaveProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-accent)", "var(--pl-info)"]} uniforms={{ uLines: lines }} {...props} />;
}
