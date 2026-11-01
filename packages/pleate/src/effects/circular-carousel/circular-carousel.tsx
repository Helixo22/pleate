// CircularCarousel: images on a 3D ring seen from slightly above. Drag to spin it with momentum; it snaps to the
// nearest card when it settles. Clicking a card (or Enter on it) turns it to the front, arrow keys step through
// the ring. Cards are shaded by their angle so the ring reads as curved. Unlike Carousel3D (pleate/effects/depth),
// which steps with buttons, this one is free spinning. Reduced motion snaps without the spin.
"use client";

import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useRef, useState, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type CircularCarouselProps = {
  images: { src: string; alt: string; title?: string }[];
  /** Card size in px. */
  cardWidth?: number;
  cardHeight?: number;
  /** Ring radius in px; defaults to fit the cards with a small gap. */
  radius?: number;
  /** Tilt of the camera above the ring, degrees. */
  tilt?: number;
  onIndexChange?: (index: number) => void;
  /** Accessible name of the carousel. */
  label?: string;
  className?: string;
};

export function CircularCarousel({ images, cardWidth = 180, cardHeight = 240, radius, tilt = 8, onIndexChange, label = "Gallery", className }: CircularCarouselProps) {
  const count = images.length;
  const step = 360 / count;
  const r = radius ?? Math.round((cardWidth + 24) / (2 * Math.tan(Math.PI / count)));
  const reduced = useReducedMotion();
  const rotation = useMotionValue(0);
  const ringTransform = useTransform(rotation, (v) => `translateZ(${-r}px) rotateX(${-tilt}deg) rotateY(${v}deg)`);
  const [active, setActive] = useState(0);
  const drag = useRef<{ x: number; start: number; last: number; t: number; v: number; moved: boolean } | null>(null);

  const indexOf = (rot: number) => (((Math.round(-rot / step) % count) + count) % count);
  useMotionValueEvent(rotation, "change", (v) => {
    const i = indexOf(v);
    if (i !== active) {
      setActive(i);
      onIndexChange?.(i);
    }
  });

  const settle = (target: number) => {
    const snapped = Math.round(target / step) * step;
    animate(rotation, snapped, reduced ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 18 });
  };
  // Turn to card i the short way round.
  const focusCard = (i: number) => {
    const current = rotation.get();
    let delta = (-i * step - current) % 360;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    settle(current + delta);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const to = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: count - 1 }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    const i = ((to % count) + count) % count;
    focusCard(i);
    event.currentTarget.querySelector<HTMLElement>(`[data-index="${i}"]`)?.focus({ preventScroll: true });
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("relative w-full touch-pan-y overflow-hidden select-none [perspective:1100px]", className)}
      style={{ height: cardHeight + 120 }}
      onPointerDown={(event) => {
        drag.current = { x: event.clientX, start: rotation.get(), last: event.clientX, t: performance.now(), v: 0, moved: false };
        rotation.stop();
      }}
      onPointerMove={(event) => {
        const d = drag.current;
        if (!d) return;
        const now = performance.now();
        d.v = (event.clientX - d.last) / Math.max(1, now - d.t);
        d.last = event.clientX;
        d.t = now;
        if (Math.abs(event.clientX - d.x) > 4 && !d.moved) {
          d.moved = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        if (d.moved) rotation.set(d.start + (event.clientX - d.x) * 0.25);
      }}
      onPointerUp={() => {
        const d = drag.current;
        drag.current = null;
        if (d?.moved) settle(rotation.get() + (reduced ? 0 : d.v * 120));
      }}
      onPointerCancel={() => {
        drag.current = null;
        settle(rotation.get());
      }}
    >
      <motion.div className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]" style={{ transform: ringTransform }}>
        {images.map((image, i) => (
          <Card key={image.src + i} index={i} step={step} rotation={rotation} r={r} width={cardWidth} height={cardHeight} active={i === active} count={count} onPick={() => focusCard(i)} image={image} />
        ))}
      </motion.div>
      <p aria-live="polite" className="absolute inset-x-0 bottom-3 text-center text-subhead text-fg-muted">
        {images[active]?.title ?? `${active + 1} of ${count}`}
      </p>
    </section>
  );
}

function Card({
  index,
  step,
  rotation,
  r,
  width,
  height,
  active,
  count,
  onPick,
  image,
}: {
  index: number;
  step: number;
  rotation: MotionValue<number>;
  r: number;
  width: number;
  height: number;
  active: boolean;
  count: number;
  onPick: () => void;
  image: { src: string; alt: string };
}) {
  // Shade cards turned away from the viewer.
  const shade = useTransform(rotation, (v) => {
    const a = (((index * step + v) % 360) + 540) % 360 - 180;
    return 0.55 * Math.min(1, Math.abs(a) / 120);
  });
  return (
    <button
      type="button"
      data-index={index}
      onClick={onPick}
      aria-label={`${image.alt}, ${index + 1} of ${count}`}
      aria-current={active || undefined}
      tabIndex={active ? 0 : -1}
      className="pl-focus-ring absolute cursor-pointer overflow-hidden rounded-xl bg-fill-3 shadow-[0_14px_40px_rgb(0_0_0/0.3)]"
      style={{ width, height, left: -width / 2, top: -height / 2, transform: `rotateY(${index * step}deg) translateZ(${r}px)` }}
    >
      <img src={image.src} alt="" draggable={false} className="size-full object-cover" />
      <motion.span aria-hidden="true" className="absolute inset-0 bg-black" style={{ opacity: shade }} />
      {/* A highlight across the middle makes the flat card read as gently bent. */}
      <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0/0.18),transparent_30%,rgb(255_255_255/0.08)_50%,transparent_70%,rgb(0_0_0/0.18))]" />
    </button>
  );
}
