// Iris: a single glowing eye. Fibers run through the iris, a slit pupil breathes, and a flickering corona burns
// around the rim. The eye follows the pointer and wanders slowly when it is away.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type IrisProps = BackgroundProps & {
  /** Strength of the corona around the iris, 0..2. */
  flare?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uFlare;
vec3 glow(vec3 b, vec3 c, float a) { a = max(a, 0.0); float dark = step(dot(b, vec3(0.3, 0.59, 0.11)), 0.5); return mix(mix(b, c, min(a, 1.0)), b + c * a, dark); }
void main() {
  vec2 p = bgUv();
  vec2 idle = vec2(sin(uTime * 0.5) * 0.3, cos(uTime * 0.37) * 0.15);
  vec2 look = mix(idle, bgPointer(), uPointerActive);
  look *= min(1.0, 0.6 / max(length(look), 0.001));
  vec2 q = p - look * 0.12;
  float r = length(q);
  vec2 dir = q / max(r, 1e-4);
  float irisR = 0.3;
  float fibers = vnoise(dir * 14.0 + vec2(0.0, uTime * 0.1)) * 0.6 + vnoise(dir * 36.0 + r * 4.0) * 0.4;
  fibers *= 0.6 + 0.4 * vnoise(dir * 4.0 + r * 12.0 - uTime * 0.3);
  float iris = smoothstep(irisR + bgPx() * 1.5, irisR - bgPx() * 1.5, r);
  vec3 ic = mix(uColor0 * 0.3, mix(uColor0, uColor1, fibers), smoothstep(0.02, irisR, r)) * (0.5 + 0.9 * fibers);
  ic += uColor1 * smoothstep(irisR * 0.6, irisR, r) * 0.25;
  float flame = fbm(dir * 3.0 + vec2(r * 4.0 - uTime * 0.6, uTime * 0.2));
  float corona = exp(-max(r - irisR, 0.0) * 7.0) * (0.4 + flame) * smoothstep(irisR - 0.01, irisR + 0.02, r) * uFlare;
  vec3 col = glow(uColor2, uColor0, corona);
  col = mix(col, ic, iris);
  vec2 pq = q / vec2(0.045 + 0.02 * sin(uTime * 0.7), 0.22);
  float pupil = smoothstep(1.05, 0.95, length(pq));
  col = mix(col, vec3(0.0), pupil * iris);
  fragColor = vec4(col, 1.0);
}`;

/** `colors`: [iris, iris highlight, background]. */
export function Iris({ flare = 1, ...props }: IrisProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) 0.88 0.12 calc(h + 30))", "var(--pl-bg)"]}
      uniforms={{ uFlare: flare }}
      {...props}
    />
  );
}
