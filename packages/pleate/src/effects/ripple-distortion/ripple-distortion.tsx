// RippleDistortion: an image that ripples like water under the cursor. A ring-shaped displacement map (drawn once
// on a canvas) follows the pointer inside an SVG filter; moving stirs it up, stopping lets it settle. No WebGL, so any
// image works, cross-origin included. Touch screens and reduced motion show the still image.
"use client";

import { useEffect, useId, useRef, type ImgHTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type RippleDistortionProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  src: string;
  alt: string;
  /** How far pixels get pushed (px). */
  strength?: number;
  /** Ripple radius (px). */
  radius?: number;
};

let rippleMap = "";
function makeRippleMap() {
  if (rippleMap) return rippleMap;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x / size) * 2 - 1, dy = (y / size) * 2 - 1;
      const r = Math.hypot(dx, dy);
      // Radial push that alternates in and out, fading to nothing at the edge: concentric rings.
      const wave = r < 1 ? Math.sin(r * Math.PI * 5) * (1 - r) ** 1.5 : 0;
      const i = (y * size + x) * 4;
      image.data[i] = 128 + 127 * wave * (r ? dx / r : 0);
      image.data[i + 1] = 128 + 127 * wave * (r ? dy / r : 0);
      image.data[i + 2] = 128;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return (rippleMap = canvas.toDataURL());
}

export function RippleDistortion({ src, alt, strength = 28, radius = 140, className, style, ...props }: RippleDistortionProps) {
  const id = `pl-ripple-${useId().replace(/:/g, "")}`;
  const img = useRef<HTMLImageElement>(null);
  const feImage = useRef<SVGFEImageElement>(null);
  const displace = useRef<SVGFEDisplacementMapElement>(null);
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const on = fine && !reduced;

  useEffect(() => {
    const el = img.current, map = feImage.current, d = displace.current;
    if (!on || !el || !map || !d) return;
    map.setAttribute("href", makeRippleMap());
    const p = { x: 0, y: 0, energy: 0 };
    let frame = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      p.energy *= Math.exp(-dt * 2.5);
      const t = now / 1000;
      const r = radius * (0.85 + 0.15 * Math.sin(t * 6));
      map.setAttribute("x", String(p.x - r));
      map.setAttribute("y", String(p.y - r));
      map.setAttribute("width", String(r * 2));
      map.setAttribute("height", String(r * 2));
      d.setAttribute("scale", String(strength * p.energy));
      frame = p.energy > 0.01 ? requestAnimationFrame(tick) : 0;
      if (!frame) d.setAttribute("scale", "0");
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const box = el.getBoundingClientRect();
      const nx = e.clientX - box.left, ny = e.clientY - box.top;
      p.energy = Math.min(1, p.energy + Math.hypot(nx - p.x, ny - p.y) / 60);
      p.x = nx;
      p.y = ny;
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    el.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
    };
  }, [on, strength, radius]);

  return (
    <>
      {on && (
        <svg aria-hidden="true" className="absolute size-0">
          <filter id={id} x="0" y="0" width="100%" height="100%" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodColor="rgb(128,128,128)" result="flat" />
            <feImage ref={feImage} x="-999" y="-999" width="1" height="1" preserveAspectRatio="none" result="ripple" />
            <feComposite in="ripple" in2="flat" operator="over" result="map" />
            <feDisplacementMap ref={displace} in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <img ref={img} src={src} alt={alt} draggable={false} className={cn("block object-cover", className)} style={{ ...style, filter: on ? `url(#${id})` : style?.filter }} {...props} />
    </>
  );
}
