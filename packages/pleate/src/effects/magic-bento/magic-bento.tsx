// MagicBento: a bento grid whose cards light up around the pointer. Each card's border glows where the pointer is
// close, even from a neighbor card, and a soft spotlight follows it inside. Optional tilt. Touch screens and
// reduced motion get plain cards.
"use client";

import { useRef, type CSSProperties, type HTMLAttributes, type PointerEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type MagicBentoProps = HTMLAttributes<HTMLDivElement> & {
  /** Glow radius (px). */
  glowRadius?: number;
  /** Glow color (CSS). */
  glowColor?: string;
  /** Tilt cards toward the pointer (degrees, 0 = off). */
  tilt?: number;
};

export function MagicBento({ glowRadius = 260, glowColor = "var(--pl-accent)", tilt = 0, className, style, children, ...props }: MagicBentoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const live = fine && !reduced;
  const update = (event: PointerEvent<HTMLDivElement> | null) => {
    if (!live) return;
    ref.current?.querySelectorAll<HTMLElement>("[data-bento-card]").forEach((card) => {
      const r = card.getBoundingClientRect();
      if (!event) {
        card.style.setProperty("--o", "0");
        card.style.transform = "";
        return;
      }
      const x = event.clientX - r.left, y = event.clientY - r.top;
      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
      card.style.setProperty("--o", "1");
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      card.style.transform = tilt && inside ? `perspective(900px) rotateX(${(0.5 - y / r.height) * tilt}deg) rotateY(${(x / r.width - 0.5) * tilt}deg)` : "";
    });
  };
  return (
    <div
      ref={ref}
      onPointerMove={update}
      onPointerLeave={() => update(null)}
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[11rem]", className)}
      style={{ "--glow-r": `${glowRadius}px`, "--glow-c": glowColor, ...style } as CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}

export type MagicBentoCardProps = HTMLAttributes<HTMLDivElement>;

/** One card of the grid. Use Tailwind's col-span / row-span classes to shape the bento. */
export function MagicBentoCard({ className, children, ...props }: MagicBentoCardProps) {
  return (
    <div
      data-bento-card=""
      className={cn("relative isolate rounded-3xl p-px transition-transform duration-200 ease-out", className)}
      style={{ background: "radial-gradient(var(--glow-r) circle at var(--mx, -999px) var(--my, -999px), color-mix(in oklab, var(--glow-c) calc(var(--o, 0) * 90%), transparent), transparent 70%), var(--pl-separator)" }}
      {...props}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-1px)] bg-surface p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{ opacity: "var(--o, 0)", background: "radial-gradient(calc(var(--glow-r) * 0.8) circle at var(--mx) var(--my), color-mix(in oklab, var(--glow-c) 12%, transparent), transparent 70%)" }}
        />
        <div className="relative flex h-full flex-col">{children}</div>
      </div>
    </div>
  );
}
