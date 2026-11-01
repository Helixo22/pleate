// GridScan: a perspective grid on floor and ceiling running to a glowing horizon, with a bright scan band
// sweeping through it. The pointer steers the view. A WebGL2 shader on ShaderBackground.
"use client";

import { BG_GLSL, ShaderBackground, type BackgroundProps } from "../background-kit/background-kit.tsx";

export type GridScanProps = BackgroundProps & {
  /** Grid cells per unit of depth. */
  density?: number;
  /** Speed of the scan band. */
  scanSpeed?: number;
};

const FRAGMENT = `${BG_GLSL}
uniform float uDensity; uniform float uScan;
#define dk step(dot(uBg, vec3(0.299, 0.587, 0.114)), 0.5)
void main() {
  vec2 uv = bgUv();
  vec2 pp = bgPointer() * uPointerActive;
  float y = uv.y - pp.y * 0.15;
  float z = 0.32 / max(abs(y), 0.002);
  vec2 g = vec2((uv.x - pp.x * 0.25) * z, z + uTime * 0.6) * uDensity * 2.0;
  vec2 fw = fwidth(g);
  vec2 gl = abs(fract(g) - 0.5) / max(fw, 1e-4);
  float line = 1.0 - min(min(gl.x, gl.y) * 0.7, 1.0);
  float fade = smoothstep(0.0, 0.22, abs(y)) * (1.0 - smoothstep(0.35, 1.2, min(fw.x, fw.y)));
  float s = mod(uTime * 2.4 * uScan, 14.0);
  float scan = exp(-abs(z - s) * 1.6) * smoothstep(0.02, 0.15, abs(y));
  float i = line * fade * (0.45 + 1.8 * scan);
  vec3 col = mix(uBg, uColor0, clamp(i, 0.0, 1.0));
  col = mix(col, uColor1, clamp(scan * 0.22 + line * scan * fade * 0.6, 0.0, 1.0));
  col += uColor1 * exp(-abs(y) * 24.0) * 0.35 * dk;
  col = mix(col, uColor1, exp(-abs(y) * 24.0) * 0.25 * (1.0 - dk));
  fragColor = vec4(col, 1.0);
}
`;

/** Colors: grid lines and the scan band (default: accent and accent light). */
export function GridScan({ density = 1, scanSpeed = 1, ...props }: GridScanProps) {
  return <ShaderBackground {...props} fragment={FRAGMENT} defaults={["var(--pl-accent)", "var(--pl-accent-300)"]} uniforms={{ uDensity: density, uScan: scanSpeed }} />;
}
