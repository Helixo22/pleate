// ColorBends: wide bands of color that bend and flow into each other like light through warped glass. The pointer
// pushes a soft dent into the bands.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type ColorBendsProps = BackgroundProps & {
  /** How much the bands wave, 0..2. */
  warp?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uWarp;
void main() {
  vec2 p = bgUv();
  vec2 d = p - bgPointer();
  p += normalize(d + 1e-4) * 0.18 * uPointerActive * exp(-length(d) * 3.0);
  float t = uTime * 0.3;
  float v = p.x * 1.2 + uWarp * (sin(p.y * 2.0 + t) * 0.5 + sin(p.y * 3.7 - t * 1.3 + p.x) * 0.25 + (fbm(p + t * 0.2) - 0.5) * 0.8);
  float s = fract((v * 0.8 + t * 0.5) / 3.0) * 3.0;
  vec3 col = mix(uColor0, uColor1, smoothstep(0.0, 1.0, s));
  col = mix(col, uColor2, smoothstep(1.0, 2.0, s));
  col = mix(col, uColor0, smoothstep(2.0, 3.0, s));
  col *= 0.88 + 0.12 * cos(s * 6.2832);
  fragColor = vec4(mix(uColor3, col, 0.92), 1.0);
}`;

/** `colors`: [three band colors, background tint]. */
export function ColorBends({ warp = 1, ...props }: ColorBendsProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) l c calc(h + 70))", "oklch(from var(--pl-accent) l c calc(h - 80))", "var(--pl-bg)"]}
      uniforms={{ uWarp: warp }}
      {...props}
    />
  );
}
