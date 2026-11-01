// FlexCarousel: an endless row of images gliding sideways that bends through a band of invisible liquid glass
// at each edge: near the edges the pictures swell, ripple and blur as if seen through a thick lens, and are clear
// in the middle. Built from two copies of the row: a plain one, and a warped one (SVG displacement, scale, blur)
// masked to the edges. It pauses on hover; reduced motion keeps it still. Only the first copy of the images is
// read by assistive tech.
"use client";

import { useId, type CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";

export type FlexCarouselProps = {
  images: { src: string; alt: string }[];
  /** Tile size, px. */
  itemWidth?: number;
  itemHeight?: number;
  /** Seconds for one full loop. */
  duration?: number;
  /** Width of each glass edge as a share of the row (0 to 0.5). */
  edge?: number;
  /** Strength of the warp, px. */
  distortion?: number;
  /** Accessible name of the row. */
  label?: string;
  className?: string;
};

export function FlexCarousel({ images, itemWidth = 220, itemHeight = 280, duration = 30, edge = 0.22, distortion = 40, label = "Gallery", className }: FlexCarouselProps) {
  const id = useId().replace(/:/g, "");
  const e = Math.round(edge * 100);
  const edgeMask = `linear-gradient(90deg, #000, #000 ${e * 0.4}%, transparent ${e}%, transparent ${100 - e}%, #000 ${100 - e * 0.4}%, #000)`;
  const centerMask = `linear-gradient(90deg, transparent, transparent ${e * 0.4}%, #000 ${e}%, #000 ${100 - e}%, transparent ${100 - e * 0.4}%, transparent)`;

  const row = (warped: boolean) => (
    <div className="flex w-max" aria-hidden={warped || undefined}>
      {[0, 1].map((copy) => (
        <ul
          key={copy}
          aria-label={!warped && copy === 0 ? label : undefined}
          aria-hidden={copy === 1 || undefined}
          className="flex shrink-0 gap-4 pr-4 motion-safe:animate-[pl-flex-loop_var(--fc-d)_linear_infinite] group-hover/fc:[animation-play-state:paused]"
        >
          {images.map((image, i) => (
            <li key={i} className="shrink-0 overflow-hidden rounded-2xl bg-fill-3" style={{ width: itemWidth, height: itemHeight }}>
              <img src={image.src} alt={warped || copy === 1 ? "" : image.alt} draggable={false} loading="lazy" className="size-full object-cover" />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );

  return (
    <div className={cn("group/fc relative w-full overflow-hidden py-6", className)} style={{ "--fc-d": `${duration}s` } as CSSProperties}>
      <svg aria-hidden="true" className="absolute size-0">
        <filter id={`${id}-glass`} x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="2" seed="4" result="n" />
          <feGaussianBlur in="n" stdDeviation="6" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale={distortion} xChannelSelector="R" yChannelSelector="G" result="warp" />
          <feGaussianBlur in="warp" stdDeviation="1.2" />
        </filter>
      </svg>
      <div style={{ maskImage: centerMask, WebkitMaskImage: centerMask }}>{row(false)}</div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 py-6"
        style={{ maskImage: edgeMask, WebkitMaskImage: edgeMask }}
      >
        <div className="origin-center scale-y-[1.12] saturate-150" style={{ filter: `url(#${id}-glass)` }}>
          {row(true)}
        </div>
      </div>
      {/* The glass rims: a faint highlight where the lens begins. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-4 left-0 rounded-r-[40px] shadow-[inset_-1px_0_0_rgb(255_255_255/0.25)]"
        style={{ width: `${e}%` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-4 right-0 rounded-l-[40px] shadow-[inset_1px_0_0_rgb(255_255_255/0.25)]"
        style={{ width: `${e}%` }}
      />
      <style>{"@keyframes pl-flex-loop { to { transform: translateX(-100%); } }"}</style>
    </div>
  );
}
