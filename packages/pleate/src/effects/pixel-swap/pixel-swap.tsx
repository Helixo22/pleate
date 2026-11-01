// PixelSwap: on hover an image builds in over the content, pixel block by pixel block, in a springy wave that starts
// where the pointer came in; on leave it falls apart from where the pointer left. Keyboard focus inside starts it from
// the center. Reduced motion swaps with a plain fade.
"use client";

import { useEffect, useRef, useState, type HTMLAttributes, type PointerEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type PixelSwapProps = HTMLAttributes<HTMLDivElement> & {
  /** Image that builds in. */
  src: string;
  /** Description of the image. */
  alt: string;
  /** Blocks across the width. */
  columns?: number;
  /** Time one block takes to pop in (ms). */
  duration?: number;
  /** Time the wave takes to cross the whole box (ms). */
  spread?: number;
};

export function PixelSwap({ src, alt, columns = 14, duration = 420, spread = 420, className, children, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props }: PixelSwapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [img, setImg] = useState({ w: 1, h: 1 });
  const [state, setState] = useState({ on: false, x: 0.5, y: 0.5 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const watch = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  useEffect(() => {
    const probe = new Image();
    probe.onload = () => setImg({ w: probe.naturalWidth, h: probe.naturalHeight });
    probe.src = src;
  }, [src]);

  const at = (e: PointerEvent<HTMLDivElement>, on: boolean) => {
    const r = e.currentTarget.getBoundingClientRect();
    setState({ on, x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  };

  // Cover-fit the image to the box, then give each block its slice of it.
  const cw = box.w / columns;
  const rows = Math.max(1, Math.round(box.h / cw));
  const ch = box.h / rows;
  const scale = Math.max(box.w / img.w, box.h / img.h);
  const bw = img.w * scale, bh = img.h * scale;
  const ox = (box.w - bw) / 2, oy = (box.h - bh) / 2;
  const diagonal = Math.hypot(box.w, box.h) || 1;

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      onPointerEnter={(e) => {
        onPointerEnter?.(e);
        at(e, true);
      }}
      onPointerLeave={(e) => {
        onPointerLeave?.(e);
        at(e, false);
      }}
      onFocus={(e) => {
        onFocus?.(e);
        setState({ on: true, x: 0.5, y: 0.5 });
      }}
      onBlur={(e) => {
        onBlur?.(e);
        setState((s) => ({ ...s, on: false }));
      }}
      {...props}
    >
      {children}
      {reduced ? (
        <img src={src} alt={alt} className={cn("pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-300", state.on ? "opacity-100" : "opacity-0")} />
      ) : (
        <div role="img" aria-label={alt} className="pointer-events-none absolute inset-0">
          {box.w > 0 &&
            Array.from({ length: columns * rows }, (_, i) => {
              const cx = (i % columns) * cw, cy = Math.floor(i / columns) * ch;
              const delay = (Math.hypot(cx + cw / 2 - state.x * box.w, cy + ch / 2 - state.y * box.h) / diagonal) * spread;
              return (
                <span
                  key={i}
                  className="absolute"
                  style={{
                    left: cx,
                    top: cy,
                    width: cw + 0.5,
                    height: ch + 0.5,
                    backgroundImage: `url("${src}")`,
                    backgroundSize: `${bw}px ${bh}px`,
                    backgroundPosition: `${ox - cx}px ${oy - cy}px`,
                    transform: state.on ? "scale(1)" : "scale(0)",
                    transition: `transform ${duration}ms ${state.on ? "cubic-bezier(0.34, 1.56, 0.64, 1)" : "cubic-bezier(0.4, 0, 1, 1)"} ${delay}ms`,
                  }}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}
