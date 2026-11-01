// DecayCard: an image card that warps like wet paint when the pointer moves over it. Pointer speed feeds an SVG
// turbulence displacement that decays back to a clean image once the pointer slows down, and the card drifts and
// leans a little towards the pointer. Touch screens and reduced motion show the plain card.
"use client";

import { motion, useSpring } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type DecayCardProps = {
  src: string;
  alt: string;
  /** Card size in px. */
  width?: number;
  height?: number;
  /** Strongest displacement in px. */
  intensity?: number;
  /** Overlay content (title, caption) drawn over the image without distortion. */
  children?: ReactNode;
  className?: string;
};

export function DecayCard({ src, alt, width = 300, height = 400, intensity = 70, children, className }: DecayCardProps) {
  const id = useId().replace(/:/g, "");
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const live = fine && !reduced;
  const map = useRef<SVGFEDisplacementMapElement>(null);
  const noise = useRef<SVGFETurbulenceElement>(null);
  const x = useSpring(0, { stiffness: 120, damping: 16 });
  const y = useSpring(0, { stiffness: 120, damping: 16 });
  const rotate = useSpring(0, { stiffness: 120, damping: 16 });
  const energy = useRef(0);
  const last = useRef<{ x: number; y: number } | null>(null);

  // Decay loop: the displacement eases back to zero each frame and the noise drifts while it is visible.
  useEffect(() => {
    if (!live) return;
    let frame = 0;
    let seed = 0;
    const tick = () => {
      energy.current *= 0.93;
      const scale = energy.current < 0.5 ? 0 : energy.current;
      map.current?.setAttribute("scale", scale.toFixed(1));
      if (scale) noise.current?.setAttribute("seed", String((seed += 0.15) | 0));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [live]);

  return (
    <motion.figure
      onPointerMove={(event) => {
        if (!live) return;
        const box = event.currentTarget.getBoundingClientRect();
        const px = event.clientX - box.left - box.width / 2;
        const py = event.clientY - box.top - box.height / 2;
        x.set(px * 0.08);
        y.set(py * 0.08);
        rotate.set(px * 0.02);
        if (last.current) {
          const speed = Math.hypot(event.clientX - last.current.x, event.clientY - last.current.y);
          energy.current = Math.min(intensity, energy.current + speed * 1.6);
        }
        last.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
        rotate.set(0);
        last.current = null;
      }}
      className={cn("relative m-0 overflow-hidden rounded-2xl bg-fill-3 shadow-[0_20px_50px_rgb(0_0_0/0.3)]", className)}
      style={{ width, height, maxWidth: "100%", x, y, rotate }}
    >
      {live && (
        <svg aria-hidden="true" className="absolute size-0">
          <filter id={`${id}-decay`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence ref={noise} type="turbulence" baseFrequency="0.012" numOctaves="2" seed="0" result="noise" />
            <feDisplacementMap ref={map} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="size-full scale-110 object-cover"
        style={live ? { filter: `url(#${id}-decay)` } : undefined}
      />
      {children && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-14 text-white">{children}</figcaption>}
    </motion.figure>
  );
}
