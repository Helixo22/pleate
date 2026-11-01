// TargetCursor: four corner brackets ring the cursor and slowly spin; over an element marked with
// `data-cursor-target` (or your own selector) they let go and lock onto its edges. The system cursor stays visible.
// It works inside its own box (or the page with `fullPage`), only for a mouse or pen. Touch screens and reduced
// motion get the plain children.
"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type TargetCursorProps = HTMLAttributes<HTMLDivElement> & {
  /** Elements the brackets lock onto. */
  targetSelector?: string;
  /** Size of the idle reticle (px). */
  size?: number;
  /** Seconds per idle turn; 0 stops the spin. */
  spinDuration?: number;
  /** Bracket color (CSS). */
  color?: string;
  /** Track the pointer over the whole page instead of this box. */
  fullPage?: boolean;
};

const CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
] as const;

export function TargetCursor({
  targetSelector = "[data-cursor-target]",
  size = 36,
  spinDuration = 3,
  color = "var(--pl-accent)",
  fullPage = false,
  className,
  children,
  ...props
}: TargetCursorProps) {
  const layer = useRef<HTMLDivElement>(null);
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const on = fine && !reduced;

  useEffect(() => {
    const el = layer.current;
    if (!on || !el) return;
    const corners = [...el.children] as HTMLElement[];
    const pos = CORNERS.map(() => ({ x: 0, y: 0 }));
    const pointer = { x: 0, y: 0, inside: false };
    let angle = 0;
    let frame = 0;
    let prev = performance.now();
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      el.style.opacity = pointer.inside ? "1" : "0";
      const r = el.getBoundingClientRect();
      const hit = pointer.inside && document.elementFromPoint(r.left + pointer.x, r.top + pointer.y)?.closest(targetSelector);
      const box = hit && (fullPage || el.parentElement?.contains(hit)) ? hit.getBoundingClientRect() : null;
      if (!box && spinDuration > 0) angle += (dt / spinDuration) * Math.PI * 2;
      // Brackets ease towards either the target's corners or the rotated reticle around the pointer.
      const k = 1 - Math.exp(-dt * (box ? 18 : 24));
      CORNERS.forEach(([sx, sy], i) => {
        let tx: number, ty: number;
        if (box) {
          tx = (sx < 0 ? box.left - 6 : box.right + 6) - r.left;
          ty = (sy < 0 ? box.top - 6 : box.bottom + 6) - r.top;
        } else {
          const a = Math.atan2(sy, sx) + angle;
          tx = pointer.x + Math.cos(a) * size * 0.7;
          ty = pointer.y + Math.sin(a) * size * 0.7;
        }
        pos[i].x += (tx - pos[i].x) * k;
        pos[i].y += (ty - pos[i].y) * k;
        const turn = box ? 0 : angle;
        corners[i].style.transform = `translate(${pos[i].x}px, ${pos[i].y}px) rotate(${turn}rad)`;
      });
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      const first = !pointer.inside;
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.inside = true;
      if (first) pos.forEach((p) => Object.assign(p, { x: pointer.x, y: pointer.y }));
    };
    const onLeave = () => (pointer.inside = false);
    const host: HTMLElement | Window = fullPage ? window : (el.parentElement ?? el);
    host.addEventListener("pointermove", onMove as EventListener);
    (fullPage ? document.documentElement : host).addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", onMove as EventListener);
      (fullPage ? document.documentElement : host).removeEventListener("pointerleave", onLeave);
    };
  }, [on, targetSelector, size, spinDuration, fullPage]);

  return (
    <div className={cn("relative", className)} {...props}>
      {children}
      {on && (
        <div
          ref={layer}
          aria-hidden="true"
          className={cn("pointer-events-none inset-0 opacity-0 transition-opacity duration-200", fullPage ? "fixed z-50" : "absolute overflow-hidden")}
        >
          {CORNERS.map(([sx, sy], i) => (
            <span
              key={i}
              className="absolute top-0 left-0 size-0"
            >
              <span
                className="absolute block size-2.5"
                style={{
                  borderColor: color,
                  borderStyle: "solid",
                  borderWidth: 0,
                  [sy < 0 ? "borderTopWidth" : "borderBottomWidth"]: 2.5,
                  [sx < 0 ? "borderLeftWidth" : "borderRightWidth"]: 2.5,
                  [sx < 0 ? "left" : "right"]: -2,
                  [sy < 0 ? "top" : "bottom"]: -2,
                }}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
