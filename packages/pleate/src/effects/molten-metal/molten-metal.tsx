// MoltenMetal: a churning pool of liquid metal, glowing hot in the seams and cooling to a dark crust. The pointer
// heats the metal under it. A WebGL2 shader on ShaderBackground.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type MoltenMetalProps = BackgroundProps & {
  /** How much of the surface glows. */
  heat?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uHeat;
void main() {
  vec2 uv = bgUv() * 1.6;
  float t = uTime * 0.12;
  vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(uv + 3.5 * q + vec2(1.7, 9.2) + t * 1.3), fbm(uv + 3.5 * q + vec2(8.3, 2.8) - t));
  float f = fbm(uv + 3.5 * r);
  vec2 d = bgUv() - bgPointer();
  f += uPointerActive * 0.3 * exp(-dot(d, d) * 12.0);
  float heat = smoothstep(0.62 - 0.22 * uHeat, 0.92, f + length(r) * 0.15);
  vec3 col = mix(uColor2, uColor1, smoothstep(0.0, 0.5, heat));
  col = mix(col, uColor0, smoothstep(0.4, 0.8, heat));
  col = mix(col, vec3(1.0), smoothstep(0.85, 1.0, heat) * 0.7);
  col += pow(abs(sin(f * 18.0)), 24.0) * 0.12;
  fragColor = vec4(mix(uBg, col, 0.94), 1.0);
}
`;

/** Colors: hot, warm and crust tones (default: accent light, accent, accent deepest). */
export function MoltenMetal({ heat = 1, ...props }: MoltenMetalProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent-300)", "var(--pl-accent)", "var(--pl-accent-950)"]} uniforms={{ uHeat: heat }} />;
}
