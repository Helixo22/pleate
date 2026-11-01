// BounceCards: a fan of photo cards that bounce in one after another when they come into view. Hovering or
// focusing a card straightens it and lifts it while its neighbours lean away. Reduced motion shows the fan still.
"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type BounceCardsProps = {
  images: { src: string; alt: string }[];
  /** Card size in px. */
  cardWidth?: number;
  cardHeight?: number;
  /** Horizontal distance between card centers, px. */
  overlap?: number;
  /** Rotation of the outermost cards, degrees. */
  fanAngle?: number;
  /** Delay between cards on entrance, seconds. */
  stagger?: number;
  /** Accessible name of the group. */
  label?: string;
  className?: string;
};

export function BounceCards({ images, cardWidth = 180, cardHeight = 220, overlap = 110, fanAngle = 10, stagger = 0.08, label = "Photos", className }: BounceCardsProps) {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState(-1);
  const mid = (images.length - 1) / 2;

  return (
    <ul
      aria-label={label}
      className={cn("relative mx-auto", className)}
      style={{ width: cardWidth + overlap * (images.length - 1), height: cardHeight + 40, maxWidth: "100%" }}
    >
      {images.map((image, i) => {
        const offset = i - mid;
        const lit = hover === i;
        const push = hover < 0 || lit ? 0 : Math.sign(i - hover) * 36;
        return (
          <motion.li
            key={image.src + i}
            tabIndex={0}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(-1)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(-1)}
            initial={reduced ? false : { scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ type: "spring", stiffness: 300, damping: 14, delay: reduced ? 0 : i * stagger }}
            className="pl-focus-ring absolute top-5 rounded-xl"
            style={{
              width: cardWidth,
              height: cardHeight,
              left: `calc(50% - ${cardWidth / 2}px + ${offset * overlap}px)`,
              zIndex: lit ? 50 : 10 - Math.abs(Math.round(offset)),
            }}
          >
            <motion.div
              className="size-full overflow-hidden rounded-xl border-4 border-surface bg-fill-3 shadow-[0_10px_30px_rgb(0_0_0/0.25)]"
              animate={{ rotate: lit ? 0 : (offset / Math.max(mid, 1)) * fanAngle, x: push, y: lit ? -12 : 0, scale: lit ? 1.06 : 1 }}
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 18 }}
            >
              <img src={image.src} alt={image.alt} draggable={false} className="size-full object-cover" />
            </motion.div>
          </motion.li>
        );
      })}
    </ul>
  );
}
