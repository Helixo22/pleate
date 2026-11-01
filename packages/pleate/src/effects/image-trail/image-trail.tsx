// ImageTrail: moving the cursor drops a trail of images that pop in and fade away. Images are decorative (alt="").
// It stays inside its own box (or the whole page with `fullPage`), only reacts to a mouse or pen and keeps the
// system cursor. Touch screens and reduced motion get the plain children.
"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type ImageTrailProps = HTMLAttributes<HTMLDivElement> & {
  /** Image URLs, used in turn. */
  images: string[];
  /** Distance the pointer travels before the next image drops (px). */
  threshold?: number;
  /** Image width (px); height follows the image. */
  size?: number;
  /** Lifetime of one image (ms). */
  duration?: number;
  /** Track the pointer over the whole page instead of this box. */
  fullPage?: boolean;
};

export function ImageTrail({ images, threshold = 80, size = 160, duration = 900, fullPage = false, className, children, ...props }: ImageTrailProps) {
  const layer = useRef<HTMLDivElement>(null);
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const on = fine && !reduced;

  useEffect(() => {
    const el = layer.current;
    if (!on || !el || !images.length) return;
    let index = 0;
    let last: { x: number; y: number } | null = null;
    let z = 1;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (last && Math.hypot(x - last.x, y - last.y) < threshold) return;
      last = { x, y };
      const img = document.createElement("img");
      img.src = images[index++ % images.length];
      img.alt = "";
      img.draggable = false;
      Object.assign(img.style, {
        position: "absolute", left: `${x}px`, top: `${y}px`, width: `${size}px`, zIndex: String(z++),
        translate: "-50% -50%", borderRadius: "var(--radius-lg)", boxShadow: "0 12px 32px rgb(0 0 0 / 0.25)",
      });
      el.appendChild(img);
      const tilt = (Math.random() - 0.5) * 12;
      img.animate(
        [
          { opacity: 0, transform: `scale(0.6) rotate(${tilt}deg)` },
          { opacity: 1, transform: `scale(1) rotate(${tilt}deg)`, offset: 0.2 },
          { opacity: 1, transform: `scale(1) rotate(${tilt}deg)`, offset: 0.6 },
          { opacity: 0, transform: `scale(0.85) rotate(${tilt}deg)` },
        ],
        { duration, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      ).onfinish = () => img.remove();
    };
    const onLeave = () => (last = null);
    const target: HTMLElement | Window = fullPage ? window : (el.parentElement ?? el);
    target.addEventListener("pointermove", onMove as EventListener);
    target.addEventListener("pointerleave", onLeave);
    return () => {
      target.removeEventListener("pointermove", onMove as EventListener);
      target.removeEventListener("pointerleave", onLeave);
      el.replaceChildren();
    };
  }, [on, images, threshold, size, duration, fullPage]);

  return (
    <div className={cn("relative", !fullPage && "overflow-hidden", className)} {...props}>
      {children}
      {on && <div ref={layer} aria-hidden="true" className={cn("pointer-events-none inset-0", fullPage ? "fixed z-50 overflow-hidden" : "absolute")} />}
    </div>
  );
}
