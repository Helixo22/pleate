// Beams: slanted shafts of light falling from the top, each with its own width and a slow shimmer running down it.
// The beams slide sideways over time; the pointer brightens the ones near it.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type BeamsProps = BackgroundProps & {
  /** Beams across the frame height. */
  density?: number;
  /** Slant in degrees. */
  angle?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uDensity;
uniform float uAngle;
vec3 glow(vec3 b, vec3 c, float a) { a = max(a, 0.0); float dark = step(dot(b, vec3(0.3, 0.59, 0.11)), 0.5); return mix(mix(b, c, min(a, 1.0)), b + c * a, dark); }
void main() {
  vec2 p0 = bgUv();
  vec2 p = rot(uAngle) * p0;
  vec2 m = rot(uAngle) * bgPointer();
  vec3 col = uColor2;
  for (int layer = 0; layer < 2; layer++) {
    float fl = float(layer);
    float x = p.x * uDensity * (1.0 + fl * 0.6) + uTime * (0.08 + fl * 0.05) + fl * 3.7;
    float id = floor(x);
    float f = fract(x);
    float r = hash12(vec2(id, 3.0 + fl));
    float w = 0.06 + 0.16 * r;
    float beam = smoothstep(w, 0.0, abs(f - 0.5));
    beam *= 0.35 + 0.65 * vnoise(vec2(id * 3.1, p.y * 1.4 + uTime * (0.4 + r)));
    beam *= smoothstep(-0.9, 0.6, p0.y);
    beam *= step(0.35, r);
    beam *= 1.0 + 1.2 * uPointerActive * exp(-abs(p.x - m.x) * 4.0);
    col = glow(col, mix(uColor0, uColor1, r), beam * (0.75 - fl * 0.3));
  }
  col = glow(col, uColor0, 0.08 * smoothstep(-0.2, 0.7, p0.y));
  fragColor = vec4(col, 1.0);
}`;

/** `colors`: [beam, second beam, background]. */
export function Beams({ density = 5, angle = 14, ...props }: BeamsProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "var(--pl-fg)", "var(--pl-bg)"]}
      uniforms={{ uDensity: density, uAngle: (angle * Math.PI) / 180 }}
      {...props}
    />
  );
}
