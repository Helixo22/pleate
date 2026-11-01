// MetallicPaint: liquid chrome flowing inside a shape. Pass the shape as an image with transparency (an SVG logo
// works best); its alpha masks a WebGL2 layer of moving metallic bands. Reduced motion shows one still frame.
"use client";

import type { CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";
import { BG_GLSL, ShaderBackground } from "../background-kit/background-kit.tsx";

export type MetallicPaintProps = {
  /** Shape image URL (SVG or PNG with transparency). Only its alpha is used. */
  src: string;
  /** Accessible name of the shape; leave empty when it is decorative. */
  alt?: string;
  /** Tint mixed into the metal (CSS, tokens allowed). */
  tint?: string;
  speed?: number;
  /** Size of the bands: above 1 is bigger. */
  scale?: number;
  className?: string;
  style?: CSSProperties;
};

const FRAGMENT = `${BG_GLSL}
void main() {
  vec2 uv = bgUv();
  float t = uTime * 0.25;
  float n = fbm(uv * 2.0 + vec2(t, -t * 0.7));
  float n2 = fbm(uv * 3.4 + n * 2.0 - t);
  float b = 0.5 + 0.5 * sin((uv.y * 3.0 + uv.x * 1.5 + n2 * 4.0) * 3.14159 + t * 3.0);
  b = pow(b, 1.6);
  vec3 col = mix(vec3(0.1, 0.11, 0.13), vec3(0.96), b);
  col = mix(col, col * mix(vec3(1.0), uColor0 * 1.6, 0.8), 0.3);
  col += pow(b, 14.0) * 0.5;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

export function MetallicPaint({ src, alt, tint, speed = 1, scale = 1, className, style }: MetallicPaintProps) {
  const mask = `url("${src}") center / contain no-repeat`;
  return (
    <div
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn("relative", className)}
      style={{ mask, WebkitMask: mask, ...style }}
    >
      <ShaderBackground
        fragment={FRAGMENT}
        defaults={["var(--pl-accent)"]}
        colors={tint ? [tint] : undefined}
        speed={speed}
        scale={scale}
        interactive={false}
        className="absolute inset-0"
      />
    </div>
  );
}
