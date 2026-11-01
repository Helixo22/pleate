// HoloCard: a collectible card with holographic foil. Tilting it toward the pointer slides a rainbow foil and a
// glitter layer across the face, with a glare where the light hits. Reduced motion keeps a still, lightly lit foil.
// The foil is decorative (aria-hidden); the card content stays plain markup.
"use client";

import { useRef, useState, type CSSProperties, type HTMLAttributes, type PointerEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type HoloCardProps = HTMLAttributes<HTMLDivElement> & {
  /** Maximum tilt in degrees. */
  maxTilt?: number;
  /** Foil strength, 0 to 1. */
  intensity?: number;
};

const FOIL =
  "repeating-linear-gradient(115deg, hsl(0 100% 70%) 0%, hsl(50 100% 65%) 7%, hsl(140 90% 60%) 14%, hsl(190 100% 65%) 21%, hsl(250 100% 72%) 28%, hsl(310 100% 70%) 35%, hsl(0 100% 70%) 42%)";
const GLITTER =
  "radial-gradient(circle at 20% 30%, #fff 0 1px, transparent 1.5px), radial-gradient(circle at 70% 60%, #fff 0 0.8px, transparent 1.3px), radial-gradient(circle at 45% 85%, #fff 0 1px, transparent 1.6px)";

export function HoloCard({ maxTilt = 14, intensity = 0.6, className, style, children, ...props }: HoloCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const set = (px: number, py: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--px", String(px));
    el.style.setProperty("--py", String(py));
    el.style.setProperty("--rx", `${(0.5 - py) * 2 * maxTilt}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 2 * maxTilt}deg`);
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const box = event.currentTarget.getBoundingClientRect();
    set((event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height);
    setHover(true);
  };
  const lit = hover ? intensity : intensity * 0.45;
  return (
    <div className={cn("[perspective:1000px]", className)} style={style} {...props}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={() => {
          set(0.5, 0.5);
          setHover(false);
        }}
        className={cn("relative isolate h-full overflow-hidden rounded-3xl bg-surface shadow-[var(--pl-shadow-xl)]", !hover && "transition-transform duration-700 ease-out")}
        style={{ "--px": 0.5, "--py": 0.5, "--rx": "0deg", "--ry": "0deg", transform: "rotateX(var(--rx)) rotateY(var(--ry))" } as CSSProperties}
      >
        {children}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-color-dodge transition-opacity duration-300"
          style={{ backgroundImage: FOIL, backgroundSize: "300% 300%", backgroundPosition: "calc(var(--px) * 100%) calc(var(--py) * 100%)", opacity: lit * 0.7 }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-overlay transition-opacity duration-300"
          style={{ backgroundImage: GLITTER, backgroundSize: "23px 19px, 31px 29px, 17px 23px", backgroundPosition: "calc(var(--px) * 40px) calc(var(--py) * 30px)", opacity: lit }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-soft-light transition-opacity duration-300"
          style={{ background: "radial-gradient(circle at calc(var(--px) * 100%) calc(var(--py) * 100%), rgb(255 255 255 / 0.8), transparent 55%)", opacity: hover ? 1 : 0 }}
        />
      </div>
    </div>
  );
}
