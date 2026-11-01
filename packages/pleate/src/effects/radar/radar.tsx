// Radar: a sweep turning over range rings and spokes, lighting up contacts as it passes. The pointer
// shows up as a contact too.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (radar); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [sweep, grid]. */
export type RadarProps = BackgroundProps;

const FRAGMENT = `${BG_GLSL}
float sweepGlow(vec2 p, float s) {
  float delta = mod(s - atan(p.y, p.x), 6.2831853);
  return exp(-delta * 2.5);
}
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime * 1.2, px = bgPx();
  float r = length(uv), ang = atan(uv.y, uv.x);
  float ringD = abs(r / 0.1 - floor(r / 0.1 + 0.5)) * 0.1;
  float spokeD = abs(sin(ang * 6.0)) * r;
  float grid = max(smoothstep(1.5 * px, 0.0, ringD), smoothstep(1.2 * px, 0.0, spokeD) * 0.6) * 0.22;
  float trail = sweepGlow(uv, t);
  float line = smoothstep(2.0 * px, 0.0, abs(sin(t - ang)) * r) * step(0.0, cos(t - ang));
  vec2 cell = floor(uv * 5.0);
  vec2 spot = (cell + 0.2 + 0.6 * hash22(cell)) / 5.0;
  float blip = step(hash12(cell + 7.0), 0.35) * smoothstep(0.012, 0.004, length(uv - spot)) * sweepGlow(spot, t);
  float you = uPointerActive * smoothstep(0.016, 0.006, length(uv - m)) * (0.4 + 0.6 * sweepGlow(m, t));
  float fade = smoothstep(1.2, 0.2, r);
  vec3 col = uColor1 * grid + uColor0 * (trail * 0.5 + line + blip + you) ;
  float a = min((grid + trail * 0.5 + line + blip + you) * fade, 1.0);
  fragColor = vec4(min(col * fade, vec3(a)), a);
}`;

export function Radar(props: RadarProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-success)", "var(--pl-fg)"]} {...props} />;
}
