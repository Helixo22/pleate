// ShapeWaves: nested outlines of a polygon that wobble like a struck string. The center drifts towards
// the pointer.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (shape-waves); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [inner, outer]. */
export type ShapeWavesProps = BackgroundProps & {
  /** Polygon sides (0 draws circles). */
  sides?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uSides;
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime * 0.8, px = bgPx();
  vec2 p = uv - m * uPointerActive * 0.25;
  float ang = atan(p.y, p.x), r = length(p);
  float poly = r;
  if (uSides >= 3.0) { float s = 6.2831853 / uSides; poly = r * cos(mod(ang + s * 0.5, s) - s * 0.5) / cos(s * 0.5); }
  float wob = 0.012 * sin(ang * 5.0 + t * 2.0 - r * 10.0) + 0.008 * sin(ang * 3.0 - t * 1.3);
  float v = (poly + wob) / 0.06 - t * 0.3;
  float d = abs(fract(v) - 0.5) * 0.06;
  float line = smoothstep(1.6 * px, 0.0, d);
  vec3 col = mix(uColor0, uColor1, clamp(r * 1.5, 0.0, 1.0));
  float a = line * smoothstep(1.1, 0.05, r) * 0.9;
  fragColor = vec4(col * a, a);
}`;

export function ShapeWaves({ sides = 6, ...props }: ShapeWavesProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-accent)", "var(--pl-info)"]} uniforms={{ uSides: sides }} {...props} />;
}
