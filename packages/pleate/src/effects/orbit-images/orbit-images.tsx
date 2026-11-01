// OrbitImages: images circle around a center on a tilted ring; the ones in front are larger and on top, the ones
// behind shrink and dim. Put anything in the middle with `children`. Reduced motion keeps them still on the ring.
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type OrbitImage = { src: string; alt: string };

export type OrbitImagesProps = {
  images: OrbitImage[];
  /** Ring radius (px). */
  radius?: number;
  /** Vertical squash of the ring: 1 is a circle seen from above, 0 a flat line. */
  tilt?: number;
  /** Image size (px). */
  itemSize?: number;
  /** Seconds per turn; negative turns the other way. */
  duration?: number;
  /** Stop while the pointer is over it. */
  pauseOnHover?: boolean;
  children?: ReactNode;
  className?: string;
};

export function OrbitImages({ images, radius = 140, tilt = 0.35, itemSize = 64, duration = 24, pauseOnHover = true, children, className }: OrbitImagesProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const items = [...(ref.current?.querySelectorAll<HTMLElement>("[data-orbit]") ?? [])];
    let angle = 0, frame = 0, last = performance.now(), paused = false;
    const place = () => {
      items.forEach((item, i) => {
        const a = angle + (i / items.length) * Math.PI * 2;
        const depth = (Math.sin(a) + 1) / 2; // 0 back, 1 front
        const s = 0.65 + depth * 0.35;
        item.style.transform = `translate(-50%, -50%) translate(${Math.cos(a) * radius}px, ${Math.sin(a) * radius * tilt}px) scale(${s})`;
        item.style.zIndex = String(Math.round(depth * 100));
        item.style.opacity = String(0.55 + depth * 0.45);
      });
    };
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!paused) angle += (dt / duration) * Math.PI * 2;
      place();
    };
    place();
    if (reduced || !duration) return;
    const host = ref.current!;
    const pause = () => (paused = pauseOnHover);
    const resume = () => (paused = false);
    host.addEventListener("pointerenter", pause);
    host.addEventListener("pointerleave", resume);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointerenter", pause);
      host.removeEventListener("pointerleave", resume);
    };
  }, [images, radius, tilt, duration, pauseOnHover, reduced]);

  return (
    <div ref={ref} className={cn("relative", className)} style={{ minHeight: radius * tilt * 2 + itemSize * 1.5, minWidth: radius * 2 + itemSize }}>
      {images.map((image, i) => (
        <img
          key={image.src + i}
          data-orbit=""
          src={image.src}
          alt={image.alt}
          draggable={false}
          className="absolute top-1/2 left-1/2 rounded-full object-cover shadow-lg"
          style={{ width: itemSize, height: itemSize }}
        />
      ))}
      <div className="absolute top-1/2 left-1/2 z-[50] -translate-x-1/2 -translate-y-1/2">{children}</div>
    </div>
  );
}
