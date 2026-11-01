// Threads: a loose bundle of fine lines rippling across the frame. The bundle reaches for the pointer.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (threads); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [first thread, last thread]. */
export type ThreadsProps = BackgroundProps & {
  /** Number of threads (up to 40). */
  count?: number;
  /** How far the threads wander. */
  amplitude?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uCount; uniform float uAmp;
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime * 0.3, px = bgPx();
  float env = smoothstep(-1.2, -0.2, uv.x) * smoothstep(1.2, 0.2, uv.x);
  vec3 col = vec3(0.0); float a = 0.0;
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    if (fi >= uCount) break;
    float k = fi / max(uCount - 1.0, 1.0);
    float n = vnoise(vec2(uv.x * 1.3 + t, fi * 0.37)) + 0.5 * vnoise(vec2(uv.x * 2.7 - t * 1.3, fi * 0.91));
    float y = (k - 0.5) * 0.18 + uAmp * 0.45 * (n - 0.75) * env;
    y += uPointerActive * (m.y - y) * 0.5 * exp(-pow((uv.x - m.x) * 2.2, 2.0));
    float g = smoothstep(1.4 * px, 0.0, abs(uv.y - y)) * 0.75;
    col += mix(uColor0, uColor1, k) * g; a += g;
  }
  a = min(a, 1.0);
  fragColor = vec4(min(col, vec3(a)), a);
}`;

export function Threads({ count = 24, amplitude = 1, ...props }: ThreadsProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-fg)", "var(--pl-accent)"]} uniforms={{ uCount: count, uAmp: amplitude }} {...props} />;
}
