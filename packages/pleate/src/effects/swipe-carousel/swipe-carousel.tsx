// SwipeCarousel: one card at a time that you swipe or drag sideways, with dots below and an optional autoplay
// timer that fills the active dot. Arrow keys, Home and End move between slides when the carousel has focus;
// slides that are off screen are hidden from assistive tech. Autoplay pauses on hover and focus and is off with
// reduced motion. (Named apart from Carousel3D, the ring carousel in pleate/effects/depth.)
"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { Children, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useControllableState } from "../../lib/use-controllable-state.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type SwipeCarouselProps = {
  children: ReactNode;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Time per slide in ms; 0 turns autoplay off. */
  autoplay?: number;
  /** Wrap from the last slide to the first. */
  loop?: boolean;
  /** Accessible name of the carousel. */
  label?: string;
  className?: string;
};

export function SwipeCarousel({ children, index, defaultIndex = 0, onIndexChange, autoplay = 0, loop = true, label = "Carousel", className }: SwipeCarouselProps) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const reduced = useReducedMotion();
  const [active, setActive] = useControllableState({ value: index, defaultValue: defaultIndex, onChange: onIndexChange });
  const [hold, setHold] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const go = (to: number) => setActive(loop ? (to + count) % count : Math.max(0, Math.min(count - 1, to)));

  // Keep the track on the active slide (after a drag, a resize or an index change).
  useEffect(() => {
    const width = track.current?.offsetWidth ?? 0;
    const controls = animate(x, -active * width, reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 34 });
    return () => controls.stop();
  }, [active, reduced, x]);

  const playing = autoplay > 0 && !reduced && !hold && count > 1;
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => go(active + 1), autoplay);
    return () => clearTimeout(timer);
  });

  const onKeyDown = (event: KeyboardEvent) => {
    const to = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: count - 1 }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    go(to);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setHold(false)}
      className={cn("pl-focus-ring w-full max-w-md rounded-2xl", className)}
    >
      <div ref={track} className="overflow-hidden rounded-2xl">
        <motion.div
          className="flex cursor-grab touch-pan-y active:cursor-grabbing"
          style={{ x }}
          drag={count > 1 ? "x" : false}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            const width = track.current?.offsetWidth ?? 1;
            const swipe = info.offset.x + info.velocity.x * 0.2;
            const to = Math.abs(swipe) > width * 0.2 ? active - Math.sign(swipe) : active;
            const next = loop ? (to + count) % count : Math.max(0, Math.min(count - 1, to));
            if (next !== active) go(next);
            else animate(x, -active * width, { type: "spring", stiffness: 300, damping: 34 });
          }}
          aria-live={playing ? "off" : "polite"}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== active || undefined}
              inert={i !== active || undefined}
              className="w-full shrink-0 select-none"
            >
              {slide}
            </div>
          ))}
        </motion.div>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === active || undefined}
            onClick={() => go(i)}
            className={cn(
              "pl-focus-ring relative h-2 cursor-pointer overflow-hidden rounded-full bg-fill-2 transition-[width] duration-300 after:absolute after:-inset-3",
              i === active ? "w-6" : "w-2",
            )}
          >
            {i === active && (
              <motion.span
                key={`${active}-${playing}`}
                aria-hidden="true"
                className="absolute inset-y-0 left-0 bg-accent"
                initial={{ width: playing ? "0%" : "100%" }}
                animate={{ width: "100%" }}
                transition={{ duration: playing ? autoplay / 1000 : 0, ease: "linear" }}
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
