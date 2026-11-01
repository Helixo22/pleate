// MetaBalls: liquid blobs that drift, merge and split; one more blob follows the pointer and melts into the rest.
// Decorative WebGL2 layer that fills its box with children on top. Transparent outside the blobs.
// Reduced motion shows one still frame.
"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { BG_GLSL, ShaderBackground } from "../background-kit/background-kit.tsx";

export type MetaBallsProps = {
  /** Blob color (CSS, tokens allowed). */
  color?: string;
  /** Number of drifting blobs (1 to 12). */
  count?: number;
  /** Blob radius, relative to the box height. */
  size?: number;
  /** Add a blob that follows the pointer. */
  followPointer?: boolean;
  speed?: number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const FRAGMENT = `${BG_GLSL}
uniform float uCount; uniform float uSize;
void main() {
  vec2 p = bgUv();
  float ar = uResolution.x / uResolution.y;
  float f = 0.0;
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    if (fi >= uCount) break;
    float s = 0.25 + 0.3 * hash12(vec2(fi, 3.1));
    vec2 c = vec2(sin(uTime * s + fi * 2.4) * 0.38 * ar, cos(uTime * s * 1.3 + fi * 1.7) * 0.32);
    float r = uSize * (0.7 + 0.6 * hash12(vec2(fi, 9.7)));
    f += r * r / max(dot(p - c, p - c), 1e-5);
  }
  vec2 m = bgPointer();
  f += uPointerActive * uSize * uSize * 1.3 / max(dot(p - m, p - m), 1e-5);
  float edge = smoothstep(1.0 - fwidth(f), 1.0 + fwidth(f), f);
  float shade = clamp((f - 1.0) * 0.12, 0.0, 1.0);
  vec3 col = mix(uColor0, mix(uColor0, vec3(1.0), 0.4), shade);
  fragColor = vec4(col * edge, edge);
}`;

export function MetaBalls({ color, count = 7, size = 0.09, followPointer = true, speed = 1, children, className, style }: MetaBallsProps) {
  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={style}>
      <ShaderBackground
        fragment={FRAGMENT}
        defaults={["var(--pl-accent)"]}
        colors={color ? [color] : undefined}
        uniforms={{ uCount: Math.max(1, Math.min(12, count)), uSize: size }}
        speed={speed}
        interactive={followPointer}
        className="absolute inset-0 -z-[1]"
      />
      {children}
    </div>
  );
}
