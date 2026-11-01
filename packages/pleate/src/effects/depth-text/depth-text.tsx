// DepthText: a heading extruded into 3D by stacking copies behind it, each a little deeper and darker. The block
// tilts toward the pointer so the sides show. The front layer is the real text; the copies are hidden from
// assistive tech. Reduced motion and touch screens keep a fixed slight angle.
"use client";

import { motion, useSpring } from "motion/react";
import { useRef, type ElementType, type PointerEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type DepthTextProps = {
  text: string;
  as?: ElementType;
  /** Number of layers behind the front. */
  layers?: number;
  /** Distance between layers (px). */
  step?: number;
  /** Maximum tilt (deg). */
  tilt?: number;
  /** Front face color (CSS). */
  color?: string;
  /** Side color (CSS); layers fade from it toward the background. */
  depthColor?: string;
  className?: string;
};

export function DepthText({
  text,
  as: Tag = "div",
  layers = 12,
  step = 1.5,
  tilt = 20,
  color = "var(--pl-fg)",
  depthColor = "var(--pl-accent)",
  className,
}: DepthTextProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const live = fine && !reduced;
  const rx = useSpring(10, { stiffness: 140, damping: 18 });
  const ry = useSpring(-14, { stiffness: 140, damping: 18 });

  const move = (e: PointerEvent) => {
    const b = ref.current?.getBoundingClientRect();
    if (!b || !live) return;
    rx.set(-((e.clientY - b.top) / b.height - 0.5) * tilt * 2);
    ry.set(((e.clientX - b.left) / b.width - 0.5) * tilt * 2);
  };
  const leave = () => {
    rx.set(10);
    ry.set(-14);
  };

  return (
    <Tag ref={ref} onPointerMove={move} onPointerLeave={leave} className={cn("block [perspective:900px]", className)}>
      <motion.span className="relative inline-block [transform-style:preserve-3d]" style={{ rotateX: rx, rotateY: ry }}>
        {Array.from({ length: layers }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="absolute inset-0 select-none"
            style={{
              transform: `translateZ(${-(layers - i) * step}px)`,
              color: `color-mix(in oklab, ${depthColor} ${Math.round(100 - ((layers - i) / layers) * 70)}%, var(--pl-bg))`,
            }}
          >
            {text}
          </span>
        ))}
        <span className="relative block" style={{ color }}>
          {text}
        </span>
      </motion.span>
    </Tag>
  );
}
