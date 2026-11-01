// CrtWarp: a blocky plasma glowing on a curved tube screen, with scanlines, an RGB phosphor mask, a faint trail of
// the previous frame, a rolling bright band and a power-on intro. The pointer bulges the picture under it.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame (after the intro) for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type CrtWarpProps = BackgroundProps & {
  /** Screen curvature, 0 (flat) to 0.4. */
  curvature?: number;
  /** Plasma blocks across the screen width. */
  blocks?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uCurve;
uniform float uBlocks;
float plasma(vec2 b, float t) {
  return sin(b.x * 0.35 + t) + sin(b.y * 0.27 - t * 1.3) + sin((b.x + b.y) * 0.18 + t * 0.7) + sin(length(b - vec2(20.0, 12.0)) * 0.3 - t);
}
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 c = uv * 2.0 - 1.0;
  c *= 1.0 + uCurve * dot(c, c) * 0.5;
  vec2 m = uPointer * 2.0 - 1.0;
  c -= (c - m) * 0.12 * uPointerActive * exp(-length(c - m) * 3.0);
  // Power on: a bright line that opens into the picture.
  float on = smoothstep(0.15, 0.9, uTime);
  float lineIn = smoothstep(0.0, 0.15, uTime);
  float inside = step(abs(c.x), 1.0) * step(abs(c.y), max(on, 0.004));
  vec2 s = c * 0.5 + 0.5;
  vec2 b = floor(s * vec2(uBlocks, uBlocks * uResolution.y / uResolution.x) / uScale);
  float t = uTime * 0.8;
  float v = max(plasma(b, t), plasma(b, t - 0.25) * 0.8) * 0.25 + 0.5;
  v = floor(v * 6.0) / 6.0;
  vec3 col = mix(uColor0 * 0.25, mix(uColor0, uColor1, smoothstep(0.4, 0.9, v)), v);
  col *= 0.7 + 0.3 * sin(gl_FragCoord.y * 1.8);
  float mask = mod(gl_FragCoord.x, 3.0);
  col *= vec3(mask < 1.0 ? 1.15 : 0.85, mask >= 1.0 && mask < 2.0 ? 1.15 : 0.85, mask >= 2.0 ? 1.15 : 0.85);
  col += 0.06 * smoothstep(0.08, 0.0, abs(fract(s.y - uTime * 0.12) - 0.5));
  col *= 1.0 - 0.6 * dot(c * 0.7, c * 0.7);
  col += (1.0 - on) * lineIn * vec3(1.0) * smoothstep(0.02, 0.0, abs(c.y));
  float edge = smoothstep(1.0, 0.97, max(abs(c.x), abs(c.y)));
  vec3 screen = mix(vec3(0.02), col, inside) * edge;
  fragColor = vec4(mix(uColor2, screen, step(max(abs(c.x), abs(c.y)), 1.0)), 1.0);
}`;

/** `colors`: [plasma, plasma highlight, surround]. */
export function CrtWarp({ curvature = 0.22, blocks = 40, ...props }: CrtWarpProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "oklch(from var(--pl-accent) 0.9 0.12 calc(h + 40))", "var(--pl-bg)"]}
      uniforms={{ uCurve: curvature, uBlocks: blocks }}
      {...props}
    />
  );
}
