// PrismaticBurst: spectral rays bursting out of a bright core and slowly turning. The core leans towards
// the pointer.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (prismatic-burst); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [tint]. */
export type PrismaticBurstProps = BackgroundProps & {
  /** How much the rays take the tint color (0 to 1). */
  tint?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uTint;
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime * 0.5;
  vec2 q = uv - m * uPointerActive * 0.4;
  float r = length(q), ang = atan(q.y, q.x);
  float rays = pow(0.5 + 0.5 * sin(ang * 12.0 + t + 2.0 * sin(ang * 5.0 - t * 0.7)), 6.0)
    + 0.6 * pow(0.5 + 0.5 * sin(ang * 7.0 - t * 1.3), 8.0)
    + 0.4 * pow(0.5 + 0.5 * sin(ang * 19.0 + t * 0.6), 10.0);
  float fade = exp(-r * 1.6) * smoothstep(0.0, 0.06, r);
  float core = 0.03 / (r + 0.03);
  vec3 col = mix(spectrum(fract(ang / 6.2831853 + r * 0.6 - t * 0.08)), uColor0, uTint);
  float a = min(rays * fade + core * 0.6, 1.0);
  fragColor = vec4(col * a, a);
}`;

export function PrismaticBurst({ tint = 0.3, ...props }: PrismaticBurstProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-accent)"]} uniforms={{ uTint: tint }} {...props} />;
}
