// FluidGlass: a piece of thick glass (a round lens or a pill) gliding over its content after the pointer. What is
// under it bends like through a real lens: magnified in the middle, pulled around at the rim, with a bright edge.
// No 3D library: the glass holds a magnified, inert copy of the content, warped by an SVG displacement map that is
// generated once on a canvas, so it works in every engine. Keep the content light (it renders twice). Touch screens
// and reduced motion park the glass in the middle.
"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type FluidGlassProps = {
  /** What the glass slides over. */
  children: ReactNode;
  shape?: "lens" | "pill";
  /** Glass size, px (pill is twice as wide). */
  size?: number;
  /** Refraction strength, px of displacement at the rim. */
  strength?: number;
  /** Magnification inside the glass. */
  magnify?: number;
  /** Glass tint (CSS). */
  tint?: string;
  className?: string;
};

/** Displacement map: red/green encode x/y offsets of a spherical bulge, neutral (128) outside the glass. */
function lensMap(w: number, h: number, radius: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Distance to the shape's inner skeleton, so a pill bulges along its whole length.
      const cx = Math.max(radius, Math.min(w - radius, x));
      const dx = (x - cx) / radius;
      const dy = (y - h / 2) / radius;
      const d = Math.min(1, Math.hypot(dx, dy));
      // Strongest near the rim, zero in the middle: a convex lens that pulls inwards.
      const k = d ** 3;
      const i = (y * w + x) * 4;
      img.data[i] = 128 - dx * k * 127;
      img.data[i + 1] = 128 - dy * k * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

export function FluidGlass({ children, shape = "lens", size = 180, strength = 40, magnify = 1.15, tint = "rgb(255 255 255 / 0.06)", className }: FluidGlassProps) {
  const id = useId().replace(/:/g, "");
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const live = fine && !reduced;
  const width = shape === "pill" ? size * 2 : size;
  const height = size;
  const [map, setMap] = useState("");
  const [area, setArea] = useState({ w: 0, h: 0 });
  const box = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 180, damping: 22, mass: 0.6 });
  const y = useSpring(0, { stiffness: 180, damping: 22, mass: 0.6 });
  // The copy inside the lens moves against the lens so it stays aligned with the content, magnified around the
  // lens center.
  const copyX = useTransform(x, (v) => -v);
  const copyY = useTransform(y, (v) => -v);
  const origin = useTransform([x, y], ([a, b]) => `${(a as number) + width / 2}px ${(b as number) + height / 2}px`);

  useEffect(() => setMap(lensMap(width, height, height / 2)), [width, height]);

  // Track the content size and park the glass in the middle (it stays there without a fine pointer).
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      setArea({ w: el.clientWidth, h: el.clientHeight });
      x.jump(el.clientWidth / 2 - width / 2);
      y.jump(el.clientHeight / 2 - height / 2);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width, height, x, y]);

  return (
    <div
      ref={box}
      onPointerMove={(event) => {
        if (!live || !box.current) return;
        const r = box.current.getBoundingClientRect();
        x.set(event.clientX - r.left - width / 2);
        y.set(event.clientY - r.top - height / 2);
      }}
      className={cn("relative isolate overflow-hidden", className)}
    >
      {children}
      {map && (
        <svg aria-hidden="true" className="absolute size-0" colorInterpolationFilters="sRGB">
          <filter id={`${id}-glass`} x="0" y="0" width={width} height={height} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse">
            <feImage href={map} x="0" y="0" width={width} height={height} result="map" preserveAspectRatio="none" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={strength} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <motion.div
        aria-hidden="true"
        inert
        className="pointer-events-none absolute top-0 left-0 z-10 overflow-hidden rounded-full"
        style={{ x, y, width, height }}
      >
        {/* Filter on an inner box, so the rounded clip of the outer one applies to the warped result. */}
        <div className="size-full overflow-hidden" style={{ filter: map ? `url(#${id}-glass) saturate(1.25)` : undefined }}>
          {area.w > 0 && (
            <motion.div className="absolute top-0 left-0" style={{ x: copyX, y: copyY, width: area.w, height: area.h, scale: magnify, transformOrigin: origin }}>
              {children}
            </motion.div>
          )}
        </div>
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-10 rounded-full"
        style={{
          x,
          y,
          width,
          height,
          background: tint,
          boxShadow:
            "inset 0 1px 1px rgb(255 255 255 / 0.55), inset 0 -1px 1px rgb(255 255 255 / 0.15), inset 0 0 0 1px rgb(255 255 255 / 0.18), 0 12px 40px rgb(0 0 0 / 0.25)",
        }}
      />
    </div>
  );
}
