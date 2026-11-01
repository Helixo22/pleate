// DepthCarousel: cards lined up on a rail that runs back into depth. The current card is in front; the next ones
// recede behind it, smaller and dimmer, and the ones already seen slide off to the side. Drag or swipe, arrow keys
// or the buttons move along the rail, and an optional timer advances it (paused on hover and focus, off with
// reduced motion). Cards out of front are hidden from assistive tech.
"use client";

import { motion } from "motion/react";
import { Children, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronRightIcon } from "../../lib/icons.tsx";
import { useControllableState } from "../../lib/use-controllable-state.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type DepthCarouselProps = {
  children: ReactNode;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Card size in px. */
  cardWidth?: number;
  cardHeight?: number;
  /** How many cards show behind the front one. */
  visible?: number;
  /** Time per card in ms; 0 turns autoplay off. */
  autoplay?: number;
  /** Accessible name of the carousel. */
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
  className?: string;
};

export function DepthCarousel({
  children,
  index,
  defaultIndex = 0,
  onIndexChange,
  cardWidth = 280,
  cardHeight = 360,
  visible = 3,
  autoplay = 0,
  label = "Carousel",
  previousLabel = "Previous",
  nextLabel = "Next",
  className,
}: DepthCarouselProps) {
  const cards = Children.toArray(children);
  const count = cards.length;
  const reduced = useReducedMotion();
  const [active, setActive] = useControllableState({ value: index, defaultValue: defaultIndex, onChange: onIndexChange });
  const [hold, setHold] = useState(false);
  const start = useRef<number | null>(null);
  const go = (to: number) => setActive((to + count) % count);

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

  const arrow = "pl-focus-ring pl-touch grid size-11 cursor-pointer place-items-center rounded-full bg-fill-3 text-fg hover:bg-fill-2 [&_svg]:size-5";
  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKeyDown}
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setHold(false)}
      className={cn("flex w-full flex-col items-center gap-5", className)}
    >
      <div
        className="relative w-full touch-pan-y select-none [perspective:1200px]"
        style={{ height: cardHeight + 40 }}
        onPointerDown={(event) => (start.current = event.clientX)}
        onPointerUp={(event) => {
          if (start.current === null) return;
          const dx = event.clientX - start.current;
          start.current = null;
          if (Math.abs(dx) > 40) go(active - Math.sign(dx));
        }}
        onPointerCancel={() => (start.current = null)}
      >
        {cards.map((card, i) => {
          // Position on the rail relative to the front card: 0 front, 1.. behind, negative already passed.
          let pos = i - active;
          if (pos < -1) pos += count;
          if (pos > count - 2 && count > 2) pos -= count;
          const behind = pos > 0;
          const shown = pos >= -1 && pos <= visible;
          return (
            <motion.div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={pos !== 0 || undefined}
              inert={pos !== 0 || undefined}
              onClick={() => pos > 0 && go(i)}
              initial={false}
              animate={{
                x: pos < 0 ? -cardWidth * 1.1 : pos * cardWidth * 0.32,
                y: pos > 0 ? -pos * 14 : 0,
                z: behind ? -pos * 140 : 0,
                rotateY: pos < 0 ? 25 : behind ? -10 : 0,
                opacity: shown ? (pos < 0 ? 0 : 1 - Math.max(0, pos) * 0.18) : 0,
                filter: `brightness(${1 - Math.max(0, pos) * 0.15})`,
              }}
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 28 }}
              className={cn("absolute top-5 left-1/2 overflow-hidden rounded-2xl bg-surface shadow-[0_20px_50px_rgb(0_0_0/0.25),inset_0_0_0_1px_var(--pl-separator)]", behind && "cursor-pointer")}
              style={{ width: cardWidth, height: cardHeight, marginLeft: -cardWidth / 2, zIndex: count - Math.abs(pos), maxWidth: "calc(100% - 64px)" }}
            >
              {card}
            </motion.div>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={previousLabel} onClick={() => go(active - 1)} className={arrow}>
          <ChevronRightIcon className="rotate-180" />
        </button>
        <span aria-live={playing ? "off" : "polite"} className="min-w-14 text-center text-footnote text-fg-muted pl-tabular">
          {active + 1} / {count}
        </span>
        <button type="button" aria-label={nextLabel} onClick={() => go(active + 1)} className={arrow}>
          <ChevronRightIcon />
        </button>
      </div>
    </section>
  );
}
