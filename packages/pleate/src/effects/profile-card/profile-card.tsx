// ProfileCard: a tall profile card that tilts toward the pointer with an iridescent sheen sliding over a colored
// backdrop. Name and title sit on top, a glass bar at the bottom holds the handle, a status and a contact button.
// Reduced motion and touch keep it flat.
"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type ProfileCardProps = {
  name: string;
  title?: string;
  handle?: string;
  status?: string;
  avatarUrl: string;
  avatarAlt?: string;
  contactLabel?: string;
  onContact?: () => void;
  /** Maximum tilt (degrees). */
  maxTilt?: number;
  /** Backdrop color (CSS). */
  color?: string;
  className?: string;
};

export function ProfileCard({ name, title, handle, status = "Online", avatarUrl, avatarAlt = "", contactLabel = "Contact", onContact, maxTilt = 10, color = "var(--pl-accent)", className }: ProfileCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const live = fine && !reduced;
  const [hover, setHover] = useState(false);
  const set = (px: number, py: number) => {
    const s = ref.current?.style;
    s?.setProperty("--px", `${px * 100}%`);
    s?.setProperty("--py", `${py * 100}%`);
    s?.setProperty("--rx", `${(0.5 - py) * maxTilt * 2}deg`);
    s?.setProperty("--ry", `${(px - 0.5) * maxTilt * 2}deg`);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!live) return;
    const r = e.currentTarget.getBoundingClientRect();
    set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    setHover(true);
  };
  return (
    <div className={cn("w-full max-w-[22rem] [perspective:1100px]", className)}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={() => (set(0.5, 0.5), setHover(false))}
        className={cn("relative isolate aspect-[3/4.4] overflow-hidden rounded-[2rem] text-white shadow-[var(--pl-shadow-xl)]", !hover && "transition-transform duration-700 ease-out")}
        style={{ "--px": "50%", "--py": "50%", "--rx": "0deg", "--ry": "0deg", transform: "rotateX(var(--rx)) rotateY(var(--ry))", background: `radial-gradient(120% 80% at 50% 0%, color-mix(in oklab, ${color} 85%, #fff), color-mix(in oklab, ${color} 55%, #000) 70%)` } as CSSProperties}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-color-dodge transition-opacity duration-300"
          style={{ opacity: hover ? 0.55 : 0.2, background: "conic-gradient(from 200deg at var(--px) var(--py), #ff6b6b, #ffd93d, #6bff95, #5ec8ff, #b06bff, #ff6b6b)", maskImage: "radial-gradient(60% 50% at var(--px) var(--py), #000, transparent)" }}
        />
        <img src={avatarUrl} alt={avatarAlt} draggable={false} className="absolute inset-x-0 bottom-0 h-[78%] w-full object-cover object-top [mask-image:linear-gradient(to_bottom,transparent,#000_25%)]" />
        <div className="relative px-6 pt-8 text-center">
          <p className="text-title1 font-semibold">{name}</p>
          {title && <p className="text-subhead text-white/75">{title}</p>}
        </div>
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-black/30 p-2.5 backdrop-blur-xl [box-shadow:inset_0_1px_0_rgb(255_255_255/0.2)]">
          <img src={avatarUrl} alt="" className="size-9 shrink-0 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            {handle && <p className="truncate text-footnote font-semibold">@{handle}</p>}
            <p className="flex items-center gap-1.5 text-caption1 text-white/70">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-success-vivid" />
              {status}
            </p>
          </div>
          <button type="button" onClick={onContact} className="pl-focus-ring pl-touch h-8 shrink-0 rounded-full bg-white/90 px-4 text-footnote font-semibold text-black transition hover:bg-white">
            {contactLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
