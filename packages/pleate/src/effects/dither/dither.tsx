// Dither: flowing noise waves printed in two colors with a 4x4 ordered (Bayer) dither, in chunky pixels. The
// pointer adds a bright spot to the field.
// WebGL2 (ShaderBackground), decorative, paused off screen, one still frame for reduced motion.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type DitherProps = BackgroundProps & {
  /** Dither pixel size in device px. */
  pixelSize?: number;
  /** Wave contrast, 0..2. */
  contrast?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uPixel;
uniform float uContrast;
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
void main() {
  vec2 cell = floor(gl_FragCoord.xy / uPixel);
  vec2 p = ((cell + 0.5) * uPixel - 0.5 * uResolution) / uResolution.y / uScale;
  float t = uTime * 0.25;
  vec2 w = vec2(fbm(p * 1.5 + t), fbm(p * 1.5 - t + 4.0));
  float v = fbm(p * 2.0 + w * 1.5 + vec2(t, -t * 0.6));
  v += 0.25 * uPointerActive * exp(-length(p - bgPointer()) * 5.0) * 2.0;
  v = clamp((v - 0.5) * (1.0 + uContrast) + 0.5, 0.0, 1.0);
  float on = step(bayer4(cell), v);
  fragColor = vec4(mix(uColor1, uColor0, on), 1.0);
}`;

/** `colors`: [ink, paper]. */
export function Dither({ pixelSize = 3, contrast = 1, ...props }: DitherProps) {
  return (
    <ShaderBackground
      fragment={FRAGMENT}
      defaults={["var(--pl-accent)", "var(--pl-bg)"]}
      uniforms={{ uPixel: Math.max(1, Math.round(pixelSize)), uContrast: contrast }}
      {...props}
    />
  );
}
