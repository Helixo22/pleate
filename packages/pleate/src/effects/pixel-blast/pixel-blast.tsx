// PixelBlast: drifting noise rendered as a dithered field of chunky pixels. The pointer sends ripples
// through it.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (pixel-blast); own WebGL2 code on ShaderCanvas.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

/** colors: [low, high]. */
export type PixelBlastProps = BackgroundProps & {
  /** Pixel shape. */
  shape?: "square" | "circle";
  /** How much of the field is lit (0 to 1). */
  density?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uShape; uniform float uDensity;
float bayer4(vec2 p) {
  ivec2 q = ivec2(mod(p, 4.0));
  const float b[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  return (b[q.x + q.y * 4] + 0.5) / 16.0;
}
void main() {
  float ps = uResolution.y / (64.0 / uScale);
  vec2 cell = floor(gl_FragCoord.xy / ps);
  vec2 c = ((cell + 0.5) * ps - 0.5 * uResolution) / uResolution.y;
  vec2 m = (uPointer - 0.5) * uResolution / uResolution.y;
  float t = uTime * 0.15;
  float v = fbm(c * 2.2 + vec2(t, -t * 0.7));
  float rm = length(c - m);
  v += uPointerActive * 0.35 * sin(rm * 28.0 - uTime * 5.0) * exp(-rm * 4.0);
  float on = step(bayer4(cell), smoothstep(0.75 - uDensity * 0.5, 0.95 - uDensity * 0.5, v));
  vec2 l = fract(gl_FragCoord.xy / ps) - 0.5;
  float mask = uShape > 0.5 ? step(length(l), 0.38) : step(max(abs(l.x), abs(l.y)), 0.4);
  vec3 col = mix(uColor0, uColor1, smoothstep(0.3, 0.8, v));
  float a = on * mask * 0.9;
  fragColor = vec4(col * a, a);
}`;

export function PixelBlast({ shape = "square", density = 0.5, ...props }: PixelBlastProps) {
  return <ShaderBackground fragment={FRAGMENT} defaults={["var(--pl-accent)", "var(--pl-info)"]} uniforms={{ uShape: shape === "circle" ? 1 : 0, uDensity: density }} {...props} />;
}
