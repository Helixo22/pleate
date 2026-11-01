// RippleGrid: a fine grid that ripples outwards from the center, and again from the pointer.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (ripple-grid); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [lines, crest]. */
export type RippleGridProps = BackgroundProps;

const FRAGMENT = `${BG_GLSL}
void main() {
  vec2 uv = bgUv(), m = bgPointer();
  float t = uTime, px = bgPx();
  vec2 p = uv;
  float r = length(p);
  float wave = sin(r * 18.0 - t * 3.0) * exp(-r * 1.4);
  p += uv / max(r, 1e-4) * wave * 0.02;
  vec2 pm = uv - m; float rm = length(pm);
  float wm = uPointerActive * sin(rm * 32.0 - t * 6.0) * exp(-rm * 5.0);
  p += pm / max(rm, 1e-4) * wm * 0.02;
  vec2 gv = abs(fract(p / 0.08 + 0.5) - 0.5) * 0.08;
  float line = smoothstep(1.3 * px, 0.0, min(gv.x, gv.y));
  float crest = clamp(wave * 0.7 + abs(wm), 0.0, 1.0);
  vec3 col = mix(uColor0, uColor1, crest);
  float a = line * (0.28 + 0.7 * crest) * smoothstep(1.3, 0.2, r);
  fragColor = vec4(col * a, a);
}`;

export function RippleGrid(props: RippleGridProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-fg)", "var(--pl-accent)"]} {...props} />;
}
