// TiltedCard: an image that tilts toward the pointer and grows a little, with a caption tag that trails the cursor
// and an optional overlay on top. Touch screens and reduced motion get the still image.
"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type TiltedCardProps = {
  src: string;
  alt: string;
  /** Tag that follows the cursor. */
  caption?: string;
  /** Content laid over the image. */
  overlay?: ReactNode;
  /** Maximum tilt (degrees). */
  maxTilt?: number;
  /** Scale while hovered. */
  scale?: number;
  className?: string;
};

const SPRING = { stiffness: 220, damping: 22, mass: 0.6 };

export function TiltedCard({ src, alt, caption, overlay, maxTilt = 12, scale = 1.06, className }: TiltedCardProps) {
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const live = fine && !reduced;
  const rx = useSpring(0, SPRING), ry = useSpring(0, SPRING), s = useSpring(1, SPRING);
  const tx = useMotionValue(0), ty = useMotionValue(0);
  const tr = useSpring(0, { stiffness: 300, damping: 30 });
  const [hover, setHover] = useState(false);
  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (!live) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    rx.set(-py * 2 * maxTilt);
    ry.set(px * 2 * maxTilt);
    tr.set(-(e.movementX || 0) * 0.6);
    tx.set(e.clientX - r.left);
    ty.set(e.clientY - r.top);
  };
  return (
    <figure
      onPointerMove={onMove}
      onPointerEnter={() => live && (s.set(scale), setHover(true))}
      onPointerLeave={() => (rx.set(0), ry.set(0), s.set(1), setHover(false))}
      className={cn("relative aspect-square w-72 [perspective:900px]", className)}
    >
      <motion.div style={{ rotateX: rx, rotateY: ry, scale: s, transformStyle: "preserve-3d" }} className="relative size-full">
        <img src={src} alt={alt} draggable={false} className="size-full rounded-3xl object-cover shadow-[var(--pl-shadow-xl)]" />
        {overlay && <div className="absolute inset-0 [transform:translateZ(36px)]">{overlay}</div>}
      </motion.div>
      {caption && (
        <>
          <figcaption className="sr-only">{caption}</figcaption>
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute top-3 left-3 z-10 rounded-md bg-elevated px-2.5 py-1 text-caption1 text-fg shadow-[var(--pl-shadow-md)] transition-opacity duration-200"
            style={{ x: tx, y: ty, rotate: tr, opacity: hover ? 1 : 0 }}
          >
            {caption}
          </motion.span>
        </>
      )}
    </figure>
  );
}
