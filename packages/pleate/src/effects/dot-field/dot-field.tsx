// DotField: a halftone field of dots whose size follows slow drifting noise and a ripple from the center, so the
// surface seems to breathe. The pointer swells the dots under it.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type DotFieldProps = BackgroundProps & {
  /** Dots across the frame height. */
  density?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uDensity;
void main() {
  vec2 p = bgUv();
  vec2 g = p * uDensity;
  vec2 id = floor(g) + 0.5;
  vec2 f = g - id;
  vec2 c = id / uDensity;
  float n = fbm(c * 1.6 + vec2(uTime * 0.12, -uTime * 0.08));
  float ripple = 0.5 + 0.5 * sin(length(c) * 9.0 - uTime * 1.4);
  float near = uPointerActive * exp(-length(c - bgPointer()) * 5.0);
  float v = clamp(smoothstep(0.3, 0.75, n) * 0.75 + ripple * 0.25 + near * 0.8, 0.0, 1.0);
  float r = 0.06 + 0.36 * v;
  float aa = uDensity * bgPx() * 1.2;
  float dotMask = smoothstep(r + aa, r - aa, length(f));
  vec3 ink = mix(uColor1, uColor0, smoothstep(0.2, 0.9, v));
  fragColor = vec4(mix(uColor2, ink, dotMask), 1.0);
}`;

/** `colors`: [large dots, small dots, background]. */
export function DotField({ density = 34, ...props }: DotFieldProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "color-mix(in srgb, var(--pl-fg) 35%, var(--pl-bg))", "var(--pl-bg)"]}
      uniforms={{ uDensity: density }}
      {...props}
    />
  );
}
