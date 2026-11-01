// GhostFibers: ribbons of fine glowing fibers that twist, fold and drift on three depths. Fibers off the focal plane
// blur out like a shallow depth of field; the pointer's height chooses which ribbon is in focus.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type GhostFibersProps = BackgroundProps & {
  /** Fibers per ribbon, 2..24. */
  fibers?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uFibers;
vec3 glow(vec3 b, vec3 c, float a) { a = max(a, 0.0); float dark = step(dot(b, vec3(0.3, 0.59, 0.11)), 0.5); return mix(mix(b, c, min(a, 1.0)), b + c * a, dark); }
void main() {
  vec2 p = bgUv();
  float px = bgPx();
  float t = uTime * 0.3;
  float focus = mix(1.0, clamp((1.0 - uPointer.y) * 2.0, 0.0, 2.0), uPointerActive);
  vec3 col = uColor2;
  for (int r = 0; r < 3; r++) {
    float fr = float(r);
    float x = p.x * (0.9 + fr * 0.2) + fr * 2.3;
    float center = 0.28 * sin(x * 0.9 + t + fr * 2.1) + 0.1 * sin(x * 2.1 - t * 0.7 + fr) + (fr - 1.0) * 0.18;
    float width = 0.13 * sin(x * 1.3 + t * 0.8 + fr * 1.4);
    float blur = px * (1.2 + 9.0 * abs(fr - focus));
    vec3 c = r == 0 ? uColor0 : (r == 1 ? uColor1 : mix(uColor0, uColor1, 0.5));
    for (int j = 0; j < 24; j++) {
      float fj = float(j);
      if (fj >= uFibers) break;
      float s = fj / max(uFibers - 1.0, 1.0) - 0.5;
      float y = center + width * s * 2.0 + 0.012 * sin(x * 7.0 + fj * 1.3 + t * 2.0);
      float d = p.y - y;
      col = glow(col, c, exp(-d * d / (blur * blur)) * 0.5 * (px * 2.0 / blur));
    }
  }
  fragColor = vec4(col, 1.0);
}`;

/** `colors`: [first ribbon, second ribbon, background]. */
export function GhostFibers({ fibers = 14, ...props }: GhostFibersProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) l c calc(h + 80))", "var(--pl-bg)"]}
      uniforms={{ uFibers: Math.min(24, Math.max(2, fibers)) }}
      {...props}
    />
  );
}
