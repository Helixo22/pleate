// CrystalizedBall: a glass sphere full of slowly turning crystal facets, with a rim light and a highlight that
// leans toward the cursor. One WebGL2 shader (see ShaderCanvas); without WebGL2 nothing is drawn. Reduced motion
// shows one still frame.
"use client";

import { useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useRgb } from "../cursor-kit/cursor-kit.ts";
import { SHADER_NOISE, ShaderCanvas } from "../shader/shader.tsx";

export type CrystalizedBallProps = HTMLAttributes<HTMLDivElement> & {
  /** Crystal color (CSS); defaults to the palette accent. */
  color?: string;
  /** Number of facets across the ball. */
  facets?: number;
  /** Ball radius as a share of the shorter side (0 to 0.5). */
  radius?: number;
  speed?: number;
};

const FRAGMENT = `
${SHADER_NOISE}
uniform vec3 uColor;
uniform float uUseColor;
uniform float uFacets;
uniform float uRadius;

// Distance to the cell border (x), cell id hash (y).
vec2 voro(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0, id = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(x, y);
    vec2 o = 0.5 + 0.42 * sin(uTime * 0.35 + 6.2831 * hash22(i + g));
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; id = hash12(i + g); } else if (d < d2) d2 = d;
  }
  return vec2(d2 - d1, id);
}

void main() {
  float m = min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / m;
  float d = length(p);
  float mask = 1.0 - smoothstep(uRadius - 1.5 / m, uRadius + 1.5 / m, d);
  if (mask <= 0.0) { fragColor = vec4(0.0); return; }
  vec3 n = normalize(vec3(p, sqrt(max(uRadius * uRadius - d * d, 0.0))));
  vec2 tilt = (uPointer - 0.5) * uPointerActive;
  vec3 base = uUseColor > 0.5 ? uColor : uAccent;
  // Refraction-ish lookup: facets bulge toward the edge of the ball.
  vec2 q = rot(uTime * 0.12) * (n.xy / (n.z + 0.5)) * uFacets * 0.5 + tilt * 2.0;
  vec2 v = voro(q);
  vec3 col = mix(base * 0.3, base * 1.1, v.y);
  col = mix(col, mix(base, vec3(1.0), 0.65), (1.0 - smoothstep(0.0, 0.07, v.x)) * 0.75);
  float fres = pow(1.0 - n.z, 2.5);
  vec3 l = normalize(vec3(-0.45 + tilt.x * 1.2, 0.55 + tilt.y * 1.2, 1.0));
  float spec = pow(max(dot(n, normalize(l + vec3(0.0, 0.0, 1.0))), 0.0), 80.0);
  col += fres * mix(base, vec3(1.0), 0.5) * 0.9 + spec;
  float a = mask * (0.82 + 0.18 * fres);
  fragColor = vec4(col * a, a);
}
`;

export function CrystalizedBall({ color, facets = 7, radius = 0.42, speed = 1, className, children, ...props }: CrystalizedBallProps) {
  const host = useRef<HTMLDivElement>(null);
  const rgb = useRgb(color ?? "var(--pl-accent)", host);
  const c = rgb ? ([rgb[0] / 255, rgb[1] / 255, rgb[2] / 255] as const) : ([0, 0, 0] as const);
  return (
    <div ref={host} className={cn("relative isolate aspect-square", className)} {...props}>
      <ShaderCanvas fragment={FRAGMENT} speed={speed} className="absolute inset-0 -z-[1]" uniforms={{ uColor: c, uUseColor: color ? 1 : 0, uFacets: facets, uRadius: radius }} />
      {children}
    </div>
  );
}
