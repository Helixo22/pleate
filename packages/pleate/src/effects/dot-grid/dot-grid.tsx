// DotGrid: a calm grid of small dots with a faint shimmer passing through. Near the pointer the dots light up in
// the accent, grow a little and are pushed away from it.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type DotGridProps = BackgroundProps & {
  /** Dots across the frame height. */
  density?: number;
  /** Radius of the pointer's influence, in frame heights. */
  radius?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uDensity;
uniform float uRadius;
void main() {
  vec2 p = bgUv();
  vec2 g = p * uDensity;
  vec2 id = floor(g) + 0.5;
  vec2 c = id / uDensity;
  vec2 dir = c - bgPointer();
  float near = uPointerActive * exp(-length(dir) / uRadius * 2.5);
  vec2 f = g - id - normalize(dir + 1e-4) * near * 0.3;
  float shimmer = 0.5 + 0.5 * sin(dot(c, vec2(1.0, 0.6)) * 5.0 - uTime * 1.2);
  float r = 0.09 + 0.07 * near;
  float aa = uDensity * bgPx() * 1.2;
  float dotMask = smoothstep(r + aa, r - aa, length(f));
  vec3 ink = mix(mix(uColor2, uColor1, 0.25 + 0.15 * shimmer), uColor0, smoothstep(0.05, 0.6, near));
  fragColor = vec4(mix(uColor2, ink, dotMask), 1.0);
}`;

/** `colors`: [active dots, resting dots, background]. */
export function DotGrid({ density = 24, radius = 0.35, ...props }: DotGridProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "var(--pl-fg)", "var(--pl-bg)"]}
      uniforms={{ uDensity: density, uRadius: radius }}
      {...props}
    />
  );
}
