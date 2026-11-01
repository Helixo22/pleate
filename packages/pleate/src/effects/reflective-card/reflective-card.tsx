// ReflectiveCard: a brushed metal ID card. As it tilts toward the pointer, a bright band sweeps across the metal and
// the "room" reflected in it shifts the other way. Pass a looping video (muted) as `reflection` to see it mirrored
// in the surface; otherwise a soft studio gradient is reflected. Reduced motion keeps it still.
"use client";

import { useRef, useState, type CSSProperties, type HTMLAttributes, type PointerEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type ReflectiveCardProps = HTMLAttributes<HTMLDivElement> & {
  /** URL of a muted looping video to reflect. */
  reflection?: string;
  /** Maximum tilt (degrees). */
  maxTilt?: number;
  /** Metal tone. */
  metal?: "silver" | "graphite" | "gold";
};

const METAL = {
  silver: ["#f4f4f6", "#b9bcc4", "#e2e3e8", "#8e9199"],
  graphite: ["#6b6e76", "#2c2e33", "#50535a", "#1b1c1f"],
  gold: ["#fbe7a8", "#c79a3a", "#f3d27a", "#8a6420"],
};

export function ReflectiveCard({ reflection, maxTilt = 12, metal = "silver", className, children, style, ...props }: ReflectiveCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const set = (px: number, py: number) => {
    const s = ref.current?.style;
    s?.setProperty("--px", String(px));
    s?.setProperty("--py", String(py));
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    setHover(true);
  };
  const [a, b, c, d] = METAL[metal];
  const dark = metal === "graphite";
  return (
    <div className={cn("[perspective:1000px]", className)} style={style} {...props}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={() => (set(0.5, 0.5), setHover(false))}
        className={cn("relative isolate aspect-[1.586] overflow-hidden rounded-3xl shadow-[var(--pl-shadow-xl)]", dark ? "text-white" : "text-black", !hover && "transition-transform duration-700 ease-out")}
        style={{
          "--px": 0.5,
          "--py": 0.5,
          transform: `rotateX(calc((0.5 - var(--py)) * ${maxTilt * 2}deg)) rotateY(calc((var(--px) - 0.5) * ${maxTilt * 2}deg))`,
          background: `repeating-linear-gradient(90deg, rgb(255 255 255 / 0.06) 0 1px, transparent 1px 3px), linear-gradient(135deg, ${a}, ${b} 35%, ${c} 60%, ${d})`,
        } as CSSProperties}
      >
        {reflection ? (
          <video
            aria-hidden="true"
            src={reflection}
            autoPlay={!reduced}
            muted
            loop
            playsInline
            className="pointer-events-none absolute -inset-[15%] size-[130%] max-w-none object-cover opacity-35 mix-blend-overlay blur-[2px] [transform:scaleX(-1)_translate(calc((var(--px)-0.5)*40px),calc((var(--py)-0.5)*30px))]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-[20%] opacity-50 mix-blend-overlay"
            style={{ background: "radial-gradient(40% 30% at 30% 25%, #fff, transparent), radial-gradient(50% 40% at 75% 80%, #000, transparent)", transform: "translate(calc((0.5 - var(--px)) * 60px), calc((0.5 - var(--py)) * 40px))" }}
          />
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{ background: "linear-gradient(115deg, transparent calc(var(--px) * 100% - 25%), rgb(255 255 255 / 0.95) calc(var(--px) * 100%), transparent calc(var(--px) * 100% + 25%))" }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] [box-shadow:inset_0_1px_0_rgb(255_255_255/0.6),inset_0_0_0_1px_rgb(255_255_255/0.25)]" />
        <div className="relative h-full p-6">{children}</div>
      </div>
    </div>
  );
}
