// Prism: a glass triangle that catches a thin beam of light and fans it out into a spectrum. It turns with
// the pointer.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (prism); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [edge, glow tint]. */
export type PrismProps = BackgroundProps;

const FRAGMENT = `${BG_GLSL}
float sdTri(vec2 p, float r) {
  const float k = 1.7320508;
  p.x = abs(p.x) - r; p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime * 0.5, px = bgPx();
  vec2 p = rot(sin(t * 0.6) * 0.12 + uPointerActive * m.x * 0.8) * uv;
  float d = sdTri(p, 0.22);
  float edge = 1.5 * px / (abs(d) + 1.5 * px) + 0.2 * exp(-abs(d) * 30.0);
  float inner = smoothstep(0.0, -0.2, d);
  vec3 col = uColor0 * edge; float a = edge;
  // Incoming white beam from the left, stopping at the glass.
  float beamIn = exp(-abs(uv.y + uv.x * 0.18 - 0.02) * 260.0) * step(uv.x, -0.05) * step(0.0, d);
  col += uColor0 * beamIn * 0.8; a += beamIn * 0.8;
  // Outgoing spectrum fanning right.
  vec2 q = uv - vec2(0.06, -0.01);
  float s = q.y / (q.x + 0.04);
  float fan = smoothstep(0.42, 0.05, abs(s - 0.05)) * smoothstep(0.0, 0.12, q.x) * exp(-q.x * 0.9) * step(0.0, d);
  fan *= 0.75 + 0.25 * sin(s * 40.0 - t * 3.0);
  vec3 spec = mix(spectrum(0.75 - (s + 0.42) * 0.9), uColor1, 0.15);
  col += spec * fan; a += fan;
  vec3 glass = mix(spectrum(fract(p.y * 1.4 + t * 0.15)), uColor1, 0.5);
  col += glass * inner * 0.35; a += inner * 0.35;
  a = min(a, 1.0);
  fragColor = vec4(min(col, vec3(a)), a);
}`;

export function Prism(props: PrismProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-fg)", "var(--pl-accent)"]} {...props} />;
}
