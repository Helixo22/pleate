// Strands: colored strands of light twist inside a frosted glass orb and swell into a bulge where they meet, like a
// voice assistant listening. Decorative WebGL2 layer that keeps the orb round and centered in its box.
// Reduced motion shows one still frame.
"use client";

import type { CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";
import { BG_GLSL, ShaderBackground } from "../background-kit/background-kit.tsx";

export type StrandsProps = {
  /** Number of strands (1 to 8). */
  count?: number;
  /** Strand colors: a spectrum, or tints of `color`. */
  spectral?: boolean;
  /** Base color when `spectral` is off (CSS, tokens allowed). */
  color?: string;
  /** 0 to 1: how far strands swing apart. */
  amplitude?: number;
  speed?: number;
  className?: string;
  style?: CSSProperties;
};

const FRAGMENT = `${BG_GLSL}
uniform float uCount; uniform float uSpectral; uniform float uAmp;
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / (0.5 * min(uResolution.x, uResolution.y)) * 1.04;
  float r = length(p);
  float px = 2.0 / min(uResolution.x, uResolution.y);
  float m = 1.0 - smoothstep(1.0 - px * 1.5, 1.0, r);
  vec3 col = vec3(0.0);
  float env = exp(-p.x * p.x * 3.0);
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    if (fi >= uCount) break;
    float k = fi / max(uCount, 1.0);
    float y = sin(p.x * (2.0 + k) + uTime * (0.9 + 0.15 * fi) + fi * 1.9) * uAmp * 0.45 * env * (0.65 + 0.35 * sin(uTime * 0.6 + fi));
    float d = abs(p.y - y);
    float w = 0.006 + 0.05 * env;
    float glow = w / (d + w * 0.6) * 0.18;
    vec3 tone = mix(uColor0 * (0.75 + 0.5 * k), spectrum(k + uTime * 0.03), uSpectral);
    col += tone * glow * smoothstep(1.0, 0.7, r);
  }
  float rim = smoothstep(0.8, 1.0, r) * 0.35 + exp(-length(p - vec2(-0.35, 0.45)) * 5.0) * 0.25;
  col = clamp(col + rim * vec3(1.0), 0.0, 1.0) * m;
  float a = clamp(max(col.r, max(col.g, col.b)) + 0.1 * m, 0.0, 1.0);
  col += uFg * 0.05 * m;
  fragColor = vec4(min(col, vec3(a)), a);
}`;

export function Strands({ count = 5, spectral = true, color, amplitude = 0.8, speed = 1, className, style }: StrandsProps) {
  return (
    <div aria-hidden="true" className={cn("relative aspect-square", className)} style={style}>
      <ShaderBackground
        fragment={FRAGMENT}
        defaults={["var(--pl-accent)"]}
        colors={color ? [color] : undefined}
        uniforms={{ uCount: Math.max(1, Math.min(8, count)), uSpectral: spectral ? 1 : 0, uAmp: amplitude }}
        speed={speed}
        interactive={false}
        className="absolute inset-0"
      />
    </div>
  );
}
