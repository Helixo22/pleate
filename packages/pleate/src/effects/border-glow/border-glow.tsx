// BorderGlow: a card whose border lights up on the side the pointer is nearest, with a soft halo bleeding out of
// the edge. The light follows the pointer angle around the card and gets brighter the closer the pointer is to the
// edge. Touch screens and reduced motion get a still, faint glow along the top edge.
"use client";

import { useRef, type CSSProperties, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type BorderGlowProps = HTMLAttributes<HTMLDivElement> & {
  /** Glow color (CSS); defaults to the accent. */
  color?: string;
  /** Border thickness in px. */
  borderWidth?: number;
  /** Width of the lit arc in degrees. */
  spread?: number;
  /** Blur of the halo outside the card, px (0 turns it off). */
  halo?: number;
};

export function BorderGlow({ color = "var(--pl-accent)", borderWidth = 1.5, spread = 70, halo = 18, className, style, children, onPointerMove, onPointerLeave, ...props }: BorderGlowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const live = fine && !reduced;

  const ring = (blur: number): CSSProperties => ({
    padding: borderWidth,
    background: `conic-gradient(from calc(var(--bg-angle) - ${spread / 2}deg), ${color}, transparent ${spread}deg, transparent)`,
    mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
    WebkitMask: "linear-gradient(#000 0 0) content-box xor, linear-gradient(#000 0 0)",
    opacity: "var(--bg-on)",
    filter: blur ? `blur(${blur}px)` : undefined,
  });

  return (
    <div
      ref={ref}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        const el = ref.current;
        if (!el || !live) return;
        const box = el.getBoundingClientRect();
        const x = event.clientX - box.left - box.width / 2;
        const y = event.clientY - box.top - box.height / 2;
        // Distance to the nearest edge, 0 at the edge and 1 at the center.
        const edge = Math.min(1, Math.max(Math.abs(x) / (box.width / 2), Math.abs(y) / (box.height / 2)));
        el.style.setProperty("--bg-angle", `${(Math.atan2(y, x) * 180) / Math.PI + 90}deg`);
        el.style.setProperty("--bg-on", String(0.25 + 0.75 * edge ** 2));
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        ref.current?.style.setProperty("--bg-on", live ? "0" : "0.5");
      }}
      className={cn("relative isolate rounded-xl bg-surface shadow-[inset_0_0_0_1px_var(--pl-separator)]", className)}
      style={{ "--bg-angle": "0deg", "--bg-on": live ? 0 : 0.5, ...style } as CSSProperties}
      {...props}
    >
      {halo > 0 && <div aria-hidden="true" className="pointer-events-none absolute -inset-px -z-[1] rounded-[inherit] transition-opacity duration-300" style={ring(halo)} />}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300" style={ring(0)} />
      {children}
    </div>
  );
}
