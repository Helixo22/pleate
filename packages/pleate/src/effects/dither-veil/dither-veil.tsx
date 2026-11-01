// DitherVeil: a drifting veil of noise drawn as chunky ordered-dither pixels (4x4 Bayer), that parts around the
// cursor. One WebGL2 shader (see ShaderCanvas) behind the content; without WebGL2 nothing is drawn. Reduced motion
// shows one still frame.
"use client";

import { useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useRgb } from "../cursor-kit/cursor-kit.ts";
import { SHADER_NOISE, ShaderCanvas } from "../shader/shader.tsx";

export type DitherVeilProps = HTMLAttributes<HTMLDivElement> & {
  /** Dot color (CSS); defaults to the palette accent. */
  color?: string;
  /** Size of one dither pixel in px. */
  pixelSize?: number;
  /** Zoom of the noise: higher means smaller clouds. */
  scale?: number;
  /** Radius of the clearing around the cursor, as a share of the height (0 turns it off). */
  clearRadius?: number;
  speed?: number;
};

const FRAGMENT = `
${SHADER_NOISE}
uniform vec3 uColor;
uniform float uUseColor;
uniform float uPixel;
uniform float uScale;
uniform float uClear;

float bayer4(vec2 c) {
  ivec2 i = ivec2(mod(c, 4.0));
  const float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  return (m[i.x + i.y * 4] + 0.5) / 16.0;
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy / uPixel);
  vec2 uv = (cell + 0.5) * uPixel / uResolution;
  vec2 asp = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = uv * asp * uScale;
  float n = fbm(p + vec2(uTime * 0.07, -uTime * 0.05) + fbm(p * 1.4 - uTime * 0.04));
  n = smoothstep(0.4, 0.85, n);
  if (uClear > 0.0) n *= 1.0 - smoothstep(uClear, uClear * 0.2, length((uv - uPointer) * asp)) * uPointerActive;
  float on = step(bayer4(cell), n);
  vec3 c = uUseColor > 0.5 ? uColor : uAccent;
  fragColor = vec4(c * on, on);
}
`;

export function DitherVeil({ color, pixelSize = 4, scale = 2.5, clearRadius = 0.28, speed = 1, className, children, ...props }: DitherVeilProps) {
  const host = useRef<HTMLDivElement>(null);
  const rgb = useRgb(color ?? "var(--pl-accent)", host);
  const c = rgb ? ([rgb[0] / 255, rgb[1] / 255, rgb[2] / 255] as const) : ([0, 0, 0] as const);
  return (
    <div ref={host} className={cn("relative isolate overflow-hidden", className)} {...props}>
      <ShaderCanvas
        fragment={FRAGMENT}
        speed={speed}
        maxDpr={1}
        className="absolute inset-0 -z-[1]"
        uniforms={{ uColor: c, uUseColor: color ? 1 : 0, uPixel: pixelSize, uScale: scale, uClear: clearRadius }}
      />
      {children}
    </div>
  );
}
