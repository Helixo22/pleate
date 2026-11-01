// PixelSnow: square flakes falling in layers, the near ones bigger and faster. The pointer is the wind.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (pixel-snow); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [flakes]. */
export type PixelSnowProps = BackgroundProps & {
  /** How many flakes (0 to 1). */
  density?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uDensity;
void main() {
  float ps = max(2.0, uResolution.y / 180.0 * uScale);
  vec2 frag = (floor(gl_FragCoord.xy / ps) + 0.5) * ps;
  vec2 uv = (frag - 0.5 * uResolution) / uResolution.y / uScale;
  vec2 m = (uPointer - 0.5);
  float t = uTime;
  float a = 0.0;
  for (int i = 0; i < 4; i++) {
    float L = float(i);
    vec2 p = uv * (14.0 - L * 3.0);
    p.y += t * (0.5 + L * 0.45);
    p.x += sin(t * 0.3 + L) * 0.4 + uPointerActive * m.x * (1.0 + L) * 1.5;
    vec2 id = floor(p), f = fract(p) - 0.5;
    if (hash12(id + L * 13.0) > uDensity * 0.45) continue;
    vec2 off = (hash22(id + L) - 0.5) * 0.6;
    float s = 0.035 + 0.025 * L;
    float flake = step(max(abs(f.x - off.x), abs(f.y - off.y)), s);
    a += flake * (0.3 + 0.15 * L);
  }
  a = min(a, 1.0);
  fragColor = vec4(uColor0 * a, a);
}`;

export function PixelSnow({ density = 0.5, ...props }: PixelSnowProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-fg)"]} uniforms={{ uDensity: density }} {...props} />;
}
