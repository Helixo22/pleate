// DriftWall: an endless wall of image tiles seen at an angle, its rows drifting sideways in alternating
// directions. A hovered tile lifts off the wall towards the viewer and the wall slows to a stop while the pointer
// is over it. Only the first copy of each row is read by assistive tech. Reduced motion keeps the wall still.
// (TiltWall in pleate/effects/depth drifts columns vertically; this one drifts rows and lifts tiles.)
"use client";

import type { CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";

export type DriftWallProps = {
  images: { src: string; alt: string }[];
  /** Number of rows (images are dealt across them). */
  rows?: number;
  /** Tile size, px. */
  tileWidth?: number;
  tileHeight?: number;
  /** Seconds for a row to drift one full length. */
  duration?: number;
  /** Wall angle: [rotateX, rotateY, rotateZ] in degrees. */
  angle?: [number, number, number];
  /** Height of the viewport, px. */
  height?: number;
  className?: string;
};

export function DriftWall({ images, rows = 4, tileWidth = 200, tileHeight = 130, duration = 40, angle = [20, -24, 8], height = 420, className }: DriftWallProps) {
  const lines = Array.from({ length: rows }, (_, r) => {
    // Rotate the deal per row so neighbouring rows don't line up the same pictures.
    const shift = (r * 3) % images.length;
    return [...images.slice(shift), ...images.slice(0, shift)];
  });

  return (
    <div className={cn("group/dw relative w-full overflow-hidden [perspective:1000px]", className)} style={{ height }}>
      <div
        className="absolute top-1/2 left-1/2 flex w-[180%] flex-col gap-4 [transform-style:preserve-3d]"
        style={{ transform: `translate(-50%, -50%) rotateX(${angle[0]}deg) rotateY(${angle[1]}deg) rotateZ(${angle[2]}deg)` }}
      >
        {lines.map((line, r) => (
          <div key={r} className="flex w-max [transform-style:preserve-3d]">
            {[0, 1].map((copy) => (
              <ul
                key={copy}
                aria-hidden={copy === 1 || undefined}
                className="flex shrink-0 gap-4 pr-4 [transform-style:preserve-3d] motion-safe:animate-[pl-drift_var(--dw-d)_linear_infinite] group-hover/dw:[animation-play-state:paused]"
                style={{ "--dw-d": `${duration + r * 6}s`, animationDirection: r % 2 ? "reverse" : "normal" } as CSSProperties}
              >
                {line.map((image, i) => (
                  <li
                    key={i}
                    className="shrink-0 overflow-hidden rounded-xl bg-fill-3 shadow-[0_8px_24px_rgb(0_0_0/0.25)] transition-transform duration-300 ease-out hover:[transform:translateZ(60px)_scale(1.04)] motion-reduce:transition-none"
                    style={{ width: tileWidth, height: tileHeight }}
                  >
                    <img src={image.src} alt={copy === 1 ? "" : image.alt} draggable={false} loading="lazy" className="size-full object-cover" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--pl-surface)_100%)]" />
      <style>{"@keyframes pl-drift { to { transform: translateX(-100%); } }"}</style>
    </div>
  );
}
