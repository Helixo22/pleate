// Ferrofluid: a glossy black pool of magnetic fluid. Swells roll across it and raise fields of spikes, and the
// pointer pulls up a crown of spikes under it. Lit by a colored environment and a sharp highlight.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type FerrofluidProps = BackgroundProps & {
  /** Spikes across the frame height. */
  density?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uDensity;
float height(vec2 p) {
  float swell = smoothstep(0.25, 0.7, vnoise(p * 0.9 + vec2(uTime * 0.3, uTime * 0.1)));
  float crown = uPointerActive * exp(-length(p - bgPointer()) * 4.0) * 1.4;
  vec2 g = p * uDensity;
  g.x += 0.5 * mod(floor(g.y), 2.0);
  float d = length(fract(g) - 0.5);
  float amp = clamp(swell + crown, 0.0, 1.3);
  return pow(max(1.0 - d * 2.0, 0.0), 2.2) * amp * 0.3 + vnoise(p * 1.5 + uTime * 0.2) * 0.12;
}
void main() {
  vec2 p = bgUv();
  float e = bgPx();
  float h0 = height(p);
  vec3 n = normalize(vec3(h0 - height(p + vec2(e, 0.0)), h0 - height(p + vec2(0.0, e)), e * uDensity * 0.35));
  vec3 L = normalize(vec3(-0.4, 0.6, 0.7));
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 40.0);
  vec3 env = mix(uColor0, uColor1, 0.5 + 0.5 * n.x) * pow(1.0 - n.z, 1.2);
  vec3 col = uColor2 * 0.08 + vec3(0.015) + env * 1.1 + spec * mix(uColor1, vec3(1.0), 0.6);
  fragColor = vec4(col, 1.0);
}`;

/** `colors`: [environment light, highlight, fluid tint]. The fluid stays dark in both themes. */
export function Ferrofluid({ density = 22, ...props }: FerrofluidProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) 0.9 0.08 calc(h + 40))", "var(--pl-bg)"]}
      uniforms={{ uDensity: density }}
      {...props}
    />
  );
}
