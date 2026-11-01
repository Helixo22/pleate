// FloatingLines: a stack of thin glowing lines that float on slow, layered waves, shading from one color to
// another. The pointer draws the nearest lines toward it.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type FloatingLinesProps = BackgroundProps & {
  /** Number of lines, 2..32. */
  count?: number;
  /** Wave height, 0..2. */
  amplitude?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uCount;
uniform float uAmp;
vec3 glow(vec3 b, vec3 c, float a) { a = max(a, 0.0); float dark = step(dot(b, vec3(0.3, 0.59, 0.11)), 0.5); return mix(mix(b, c, min(a, 1.0)), b + c * a, dark); }
void main() {
  vec2 p = bgUv();
  vec2 m = bgPointer();
  float px = bgPx();
  vec3 col = uColor2;
  for (int i = 0; i < 32; i++) {
    float fi = float(i);
    if (fi >= uCount) break;
    float k = fi / max(uCount - 1.0, 1.0);
    float y0 = (k - 0.5) * 0.8;
    float y = y0 + uAmp * (0.07 * sin(p.x * (1.4 + k * 0.6) + uTime * (0.35 + 0.1 * k) + fi) + 0.04 * sin(p.x * 3.1 - uTime * 0.6 + fi * 1.7));
    y += (m.y - y) * 0.35 * uPointerActive * exp(-abs(p.x - m.x) * 3.0) * exp(-abs(m.y - y0) * 5.0);
    float d = abs(p.y - y);
    float line = smoothstep(px * 2.0, 0.0, d) * 0.9 + 0.25 * px * 6.0 / (d + px * 6.0);
    col = glow(col, mix(uColor0, uColor1, k), line * 0.7);
  }
  fragColor = vec4(col, 1.0);
}`;

/** `colors`: [first line, last line, background]. */
export function FloatingLines({ count = 14, amplitude = 1, ...props }: FloatingLinesProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) l c calc(h + 90))", "var(--pl-bg)"]}
      uniforms={{ uCount: Math.min(32, Math.max(2, count)), uAmp: amplitude }}
      {...props}
    />
  );
}
