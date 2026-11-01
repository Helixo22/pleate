// PixelTransition: a card that swaps between two faces behind a curtain of solid pixels. On hover (or focus, or a
// tap on touch screens) random pixels cover the first face, the second face is put in place, and the pixels clear
// away. Reduced motion swaps the faces with no curtain.
"use client";

import { useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type PixelTransitionProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  first: ReactNode;
  second: ReactNode;
  /** Pixels across (the grid is square). */
  grid?: number;
  /** Pixel color (CSS). */
  pixelColor?: string;
  /** Total time of one swap (ms). */
  duration?: number;
};

export function PixelTransition({ first, second, grid = 9, pixelColor = "var(--pl-fg)", duration = 500, className, ...props }: PixelTransitionProps) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(false);
  const [cover, setCover] = useState(false);
  const target = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Fixed pseudo random order so server and client render the same delays.
  const delays = useMemo(() => Array.from({ length: grid * grid }, (_, i) => Math.abs(Math.sin(i * 12.9898 + 4.1) * 43758.5453) % 1), [grid]);
  const half = duration / 2;

  const go = (next: boolean) => {
    if (target.current === next) return;
    target.current = next;
    if (reduced) return setShown(next);
    clearTimeout(timer.current);
    setCover(true);
    timer.current = setTimeout(() => {
      setShown(target.current);
      setCover(false);
    }, half);
  };

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onPointerEnter={(e) => e.pointerType === "mouse" && go(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && go(false)}
      onPointerUp={(e) => e.pointerType !== "mouse" && go(!target.current)}
      onFocus={() => go(true)}
      onBlur={() => go(false)}
      {...props}
    >
      <div className="size-full" inert={shown || undefined}>{first}</div>
      <div className={cn("absolute inset-0", !shown && "invisible")} inert={!shown || undefined}>{second}</div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${grid}, 1fr)`, gridTemplateRows: `repeat(${grid}, 1fr)` }}>
        {!reduced &&
          delays.map((d, i) => (
            <span
              key={i}
              style={{
                background: pixelColor,
                opacity: cover ? 1 : 0,
                transition: `opacity 0ms linear ${d * half}ms`,
              }}
            />
          ))}
      </div>
    </div>
  );
}
