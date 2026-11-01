// StickerPeel: a sticker you can drag around; hovering lifts its corner into a curl that shows the paper backing.
// The corner is cut with a clip path and a folded flap is drawn on top, both driven by one spring. Keep dragging
// inside a box with `dragConstraints`. Reduced motion keeps the corner down (dragging still works).
"use client";

import { motion, useMotionTemplate, useSpring, useTransform } from "motion/react";
import type { ReactNode, RefObject } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type StickerPeelProps = {
  /** The sticker face, usually an <img> or an SVG with its own accessible name. */
  children: ReactNode;
  /** Sticker width (px); height follows the content. */
  width?: number;
  /** How far the corner lifts on hover, as a fraction of the width. */
  peel?: number;
  /** Starting rotation (deg). */
  rotate?: number;
  /** Color of the paper backing seen on the curl (CSS). */
  backColor?: string;
  /** Element that bounds dragging. */
  dragConstraints?: RefObject<Element | null>;
  className?: string;
};

export function StickerPeel({ children, width = 180, peel = 0.28, rotate = -6, backColor = "#e9e9ee", dragConstraints, className }: StickerPeelProps) {
  const reduced = useReducedMotion();
  const lift = useSpring(0, { stiffness: 260, damping: 22 });
  const cut = useTransform(lift, (v) => v * width);
  const clipPath = useMotionTemplate`polygon(0 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%)`;
  return (
    <motion.div
      drag
      dragConstraints={dragConstraints}
      dragMomentum={false}
      whileDrag={{ scale: 1.06, cursor: "grabbing" }}
      onHoverStart={() => !reduced && lift.set(peel)}
      onHoverEnd={() => lift.set(0)}
      initial={false}
      style={{ width, rotate }}
      className={cn("relative cursor-grab touch-none drop-shadow-[0_6px_10px_rgb(0_0_0/0.25)] select-none", className)}
    >
      <motion.div style={{ clipPath }} className="[&_img]:pointer-events-none">
        {children}
      </motion.div>
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0"
        style={{ width: cut, height: cut, filter: "drop-shadow(-2px -2px 3px rgb(0 0 0 / 0.3))" }}
      >
        <span
          className="block size-full"
          style={{
            // The cut corner folded back over the diagonal: the triangle on the inner side of the cut.
            clipPath: "polygon(0 0, 100% 0, 0 100%)",
            background: `linear-gradient(135deg, ${backColor} 0%, ${backColor} 45%, color-mix(in srgb, ${backColor} 75%, #000) 100%)`,
          }}
        />
      </motion.span>
    </motion.div>
  );
}
