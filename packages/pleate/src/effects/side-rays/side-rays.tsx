// SideRays: shafts of light pouring in from the two top corners. With the pointer over it, the light
// turns to look at it.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (side-rays); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [left, right]. */
export type SideRaysProps = BackgroundProps;

const FRAGMENT = `${BG_GLSL}
float rays(vec2 p, vec2 o, vec2 dir, float seed, float t) {
  vec2 q = p - o; float r = length(q);
  float c = dot(q / max(r, 1e-4), dir);
  float ang = atan(q.y, q.x);
  float s = 0.5 + 0.25 * sin(ang * 38.0 + seed + t * 1.3) + 0.25 * sin(ang * 23.0 - t + seed * 2.0);
  return smoothstep(0.55, 1.0, c) * s * exp(-r * 0.7);
}
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime;
  float hw = 0.5 * uResolution.x / uResolution.y / uScale;
  vec2 oL = vec2(-hw, 0.55), oR = vec2(hw, 0.55);
  vec2 dL = normalize(mix(vec2(1.0, -0.7), normalize(m - oL), uPointerActive * 0.7));
  vec2 dR = normalize(mix(vec2(-1.0, -0.7), normalize(m - oR), uPointerActive * 0.7));
  float l = rays(uv, oL, dL, 1.0, t), r = rays(uv, oR, dR, 4.0, t);
  vec3 col = uColor0 * l + uColor1 * r;
  float a = min(l + r, 1.0);
  fragColor = vec4(min(col, vec3(a)), a);
}`;

export function SideRays(props: SideRaysProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-accent)", "var(--pl-info)"]} {...props} />;
}
