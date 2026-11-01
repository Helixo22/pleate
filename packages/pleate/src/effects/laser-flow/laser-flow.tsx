// LaserFlow: a bright beam falls from the top edge, flickers with flowing light, and spills a glowing fog where it
// hits the floor. Decorative WebGL2 layer; it fills its box and puts children on top. Looks best on a dark surface.
// Reduced motion shows one still frame.
"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { BG_GLSL, ShaderBackground } from "../background-kit/background-kit.tsx";

export type LaserFlowProps = {
  /** Beam color (CSS, tokens allowed). */
  color?: string;
  /** Beam position across the box, 0 left to 1 right. */
  x?: number;
  /** Height of the floor the beam hits, 0 bottom to 1 top. */
  floor?: number;
  /** Amount of fog at the hit point. */
  fog?: number;
  speed?: number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const FRAGMENT = `${BG_GLSL}
uniform float uX; uniform float uFloor; uniform float uFog;
void main() {
  vec2 p = gl_FragCoord.xy / uResolution.y;
  float ar = uResolution.x / uResolution.y;
  float dx = p.x - uX * ar;
  float fy = p.y - uFloor;
  float above = smoothstep(-0.01, 0.02, fy);
  float flow = fbm(vec2(dx * 14.0, p.y * 4.0 + uTime * 2.4));
  float core = exp(-abs(dx) / (0.0025 + 0.002 * flow)) * above;
  float glow = exp(-abs(dx) / (0.03 + 0.05 * flow)) * above * (0.45 + 0.35 * flow);
  float side = sign(dx);
  float mist = fbm(vec2(p.x * 3.0 - side * uTime * 0.35, p.y * 9.0 - uTime * 0.2));
  float fog = exp(-abs(dx) / 0.45) * exp(-abs(fy) / (0.05 + 0.05 * mist)) * mist * uFog;
  float hit = exp(-length(vec2(dx, fy * 2.5)) / 0.035);
  vec3 col = uColor0 * (glow + fog * 1.6 + hit * 0.8) + vec3(1.0) * (core * 0.9 + hit * 0.5);
  col = clamp(col, 0.0, 1.0);
  float a = max(col.r, max(col.g, col.b));
  fragColor = vec4(col, a);
}`;

export function LaserFlow({ color, x = 0.5, floor = 0.25, fog = 1, speed = 1, children, className, style }: LaserFlowProps) {
  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={style}>
      <ShaderBackground
        fragment={FRAGMENT}
        defaults={["var(--pl-accent)"]}
        colors={color ? [color] : undefined}
        uniforms={{ uX: x, uFloor: floor, uFog: fog }}
        speed={speed}
        interactive={false}
        className="absolute inset-0 -z-[1]"
      />
      {children}
    </div>
  );
}
