// Swirl: thick paint in three colors, slowly stirred around the center and drawn in chunky pixels, like a
// psychedelic card table. The pointer pulls the vortex toward it.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type SwirlProps = BackgroundProps & {
  /** Pixel size in device px; 1 turns pixelation off. */
  pixelSize?: number;
  /** How hard the paint is twisted around the center. */
  twist?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uPixel;
uniform float uTwist;
void main() {
  vec2 fc = (floor(gl_FragCoord.xy / uPixel) + 0.5) * uPixel;
  vec2 p = (fc - 0.5 * uResolution) / uResolution.y / uScale;
  p -= bgPointer() * 0.35 * uPointerActive;
  float r = length(p);
  p = rot(uTime * 0.12 + r * uTwist) * p;
  vec2 q = p * 3.5;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    q += vec2(sin(q.y * 1.3 + uTime * 0.35 + fi), cos(q.x * 1.1 - uTime * 0.28 - fi)) * 0.5;
  }
  float v = 0.5 + 0.5 * sin(q.x + q.y);
  float w = 0.5 + 0.5 * sin(length(q) * 0.9 - uTime * 0.2);
  vec3 col = mix(uColor0, uColor1, smoothstep(0.35, 0.65, v));
  col = mix(col, uColor2, smoothstep(0.55, 0.85, w) * 0.85);
  // Soft paint shading.
  col *= 0.88 + 0.12 * sin((q.x - q.y) * 2.0);
  fragColor = vec4(col, 1.0);
}`;

/** `colors`: [first paint, second paint, third paint]. */
export function Swirl({ pixelSize = 4, twist = 2.5, ...props }: SwirlProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) 0.6 0.2 calc(h + 150))", "var(--pl-bg)"]}
      uniforms={{ uPixel: Math.max(1, pixelSize), uTwist: twist }}
      {...props}
    />
  );
}
