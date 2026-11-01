// Orb: a glowing ring with a living, noisy edge. Colors drift around it, and the edge grows wilder as the
// pointer comes close to the center.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (orb); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [ring, ring alt, highlight]. */
export type OrbProps = BackgroundProps;

const FRAGMENT = `${BG_GLSL}
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime * 0.4;
  float near = uPointerActive * smoothstep(0.7, 0.0, length(m));
  float r = length(uv), ang = atan(uv.y, uv.x);
  vec2 dir = uv / max(r, 1e-4);
  float n = fbm(dir * (1.4 + near) + vec2(t, -t * 0.7));
  float R = 0.3 + (n - 0.5) * (0.14 + 0.22 * near);
  float d = abs(r - R);
  float ring = 0.01 / (d + 0.01) + 0.25 * exp(-d * 9.0);
  float inner = smoothstep(R, R - 0.22, r) * smoothstep(0.0, R, r);
  vec3 col = mix(uColor0, uColor1, 0.5 + 0.5 * sin(ang + t * 2.0 + n * 5.0));
  col = mix(col, uColor2, smoothstep(0.62, 0.9, n) * 0.6);
  float a = clamp(ring * 0.85 + inner * 0.2 * n, 0.0, 1.0) * smoothstep(1.0, 0.35, r);
  fragColor = vec4(col * a, a);
}`;

export function Orb(props: OrbProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-accent)", "var(--pl-info)", "var(--pl-fg)"]} {...props} />;
}
