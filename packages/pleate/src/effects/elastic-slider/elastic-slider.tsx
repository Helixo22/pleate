// ElasticSlider: a fill-style slider that thickens while you hover or drag it and stretches like rubber when you
// pull past either end, then springs back on release. Optional icons at both ends get nudged by the stretch. It is
// a role="slider" with arrow keys, Page Up/Down, Home and End. Reduced motion drops the stretch and the spring.
"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useControllableState } from "../../lib/use-controllable-state.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type ElasticSliderProps = {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Accessible name. */
  label: string;
  /** Icons or text at the start and end. */
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  /** Show the current value under the slider. */
  showValue?: boolean;
  /** Farthest stretch past an end, px. */
  maxStretch?: number;
  className?: string;
};

export function ElasticSlider({
  value,
  defaultValue = 50,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  startIcon,
  endIcon,
  showValue = false,
  maxStretch = 40,
  className,
}: ElasticSliderProps) {
  const reduced = useReducedMotion();
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const [active, setActive] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const overflow = useMotionValue(0); // px past an end: negative on the left, positive on the right
  const scaleX = useTransform(overflow, (o) => 1 + Math.abs(o) / (track.current?.offsetWidth || 300));
  const scaleY = useTransform(overflow, (o) => 1 - Math.min(0.25, Math.abs(o) / 200));
  const origin = useTransform(overflow, (o) => (o < 0 ? "100% 50%" : "0% 50%"));
  const startX = useTransform(overflow, (o) => (o < 0 ? o : 0));
  const endX = useTransform(overflow, (o) => (o > 0 ? o : 0));

  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min));
  const pct = ((current - min) / (max - min)) * 100;

  const fromPointer = (clientX: number) => {
    const box = track.current?.getBoundingClientRect();
    if (!box) return;
    setCurrent(clamp(min + ((clientX - box.left) / box.width) * (max - min)));
    if (reduced) return;
    // Rubber band: the further past the end, the less extra stretch each pixel gives.
    const past = clientX < box.left ? clientX - box.left : clientX > box.right ? clientX - box.right : 0;
    overflow.set(Math.sign(past) * maxStretch * (1 - Math.exp(-Math.abs(past) / (maxStretch * 2))));
  };

  const release = () => {
    setActive(false);
    animate(overflow, 0, { type: "spring", stiffness: 500, damping: 12 });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const big = Math.max(step, (max - min) / 10);
    const map: Record<string, number> = {
      ArrowRight: current + step,
      ArrowUp: current + step,
      ArrowLeft: current - step,
      ArrowDown: current - step,
      PageUp: current + big,
      PageDown: current - big,
      Home: min,
      End: max,
    };
    if (!(event.key in map)) return;
    event.preventDefault();
    setCurrent(clamp(map[event.key]!));
  };

  return (
    <div className={cn("flex w-full max-w-sm flex-col items-center gap-2", className)}>
      <div className="flex w-full items-center gap-3 text-fg-muted [&_svg]:size-5">
        {startIcon && <motion.span aria-hidden="true" style={{ x: startX }}>{startIcon}</motion.span>}
        <div
          ref={track}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current}
          onKeyDown={onKeyDown}
          onPointerEnter={() => setActive(true)}
          onPointerLeave={(event) => event.buttons === 0 && setActive(false)}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setActive(true);
            fromPointer(event.clientX);
          }}
          onPointerMove={(event) => event.buttons === 1 && event.currentTarget.hasPointerCapture(event.pointerId) && fromPointer(event.clientX)}
          onPointerUp={release}
          onPointerCancel={release}
          className="pl-focus-ring group/es relative flex h-8 flex-1 cursor-grab touch-none items-center rounded-full active:cursor-grabbing"
        >
          <motion.div
            className={cn(
              "relative w-full overflow-hidden rounded-full bg-fill-2 transition-[height] duration-200 motion-reduce:transition-none",
              active ? "h-3.5" : "h-2 group-focus-visible/es:h-3.5",
            )}
            style={{ scaleX, scaleY, transformOrigin: origin }}
          >
            <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${pct}%` }} />
          </motion.div>
        </div>
        {endIcon && <motion.span aria-hidden="true" style={{ x: endX }}>{endIcon}</motion.span>}
      </div>
      {showValue && <p aria-hidden="true" className="text-footnote text-fg-muted pl-tabular">{current}</p>}
    </div>
  );
}
