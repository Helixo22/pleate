// CardSwap: a deck of cards stacked diagonally in depth. On a timer the front card drops out of view and slides
// back in behind the others, so the whole deck keeps cycling. It pauses while hovered or focused and has a
// pause button; only the front card is exposed to assistive tech. Reduced motion stops the timer (the button
// still steps through the cards).
"use client";

import { motion } from "motion/react";
import { Children, useEffect, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type CardSwapProps = {
  children: ReactNode;
  /** Card size in px. */
  width?: number;
  height?: number;
  /** Offset between stacked cards, px (x and y). */
  distanceX?: number;
  distanceY?: number;
  /** Time each card stays in front, ms. */
  interval?: number;
  /** Pause while the pointer is over the deck. */
  pauseOnHover?: boolean;
  /** Accessible name of the deck. */
  label?: string;
  pauseLabel?: string;
  playLabel?: string;
  className?: string;
};

export function CardSwap({
  children,
  width = 320,
  height = 220,
  distanceX = 40,
  distanceY = 36,
  interval = 4000,
  pauseOnHover = true,
  label = "Cards",
  pauseLabel = "Pause",
  playLabel = "Play",
  className,
}: CardSwapProps) {
  const cards = Children.toArray(children);
  const count = cards.length;
  const reduced = useReducedMotion();
  const [front, setFront] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [paused, setPaused] = useState(false);
  const running = !reduced && !paused && !hovered && count > 1;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setFront((f) => (f + 1) % count), interval);
    return () => clearInterval(timer);
  }, [running, interval, count]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={() => pauseOnHover && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={(event) => !("swapControl" in (event.target as HTMLElement).dataset) && setHovered(true)}
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setHovered(false)}
      className={cn("relative [perspective:1000px]", className)}
      style={{ width: width + distanceX * (count - 1), height: height + distanceY * (count - 1) + 48, maxWidth: "100%" }}
    >
      {cards.map((card, i) => {
        const slot = (i - front + count) % count;
        // The card that just left the front is now in the last slot: it swings down before settling at the back.
        const justLeft = slot === count - 1 && count > 1;
        const x = slot * distanceX;
        const y = -slot * distanceY;
        return (
          <motion.div
            key={i}
            aria-hidden={slot !== 0 || undefined}
            inert={slot !== 0 || undefined}
            initial={false}
            animate={
              justLeft && !reduced
                ? { x: [0, 0, x], y: [0, height * 1.4, y], z: [0, 0, -slot * 60], rotateY: [-6, -6, -6], opacity: [1, 0, 1] }
                : { x, y, z: -slot * 60, rotateY: -6, opacity: 1 }
            }
            transition={reduced ? { duration: 0 } : justLeft ? { duration: 1.1, times: [0, 0.45, 1], ease: "easeInOut" } : { type: "spring", stiffness: 160, damping: 22 }}
            className="absolute bottom-12 left-0 overflow-hidden rounded-xl bg-surface shadow-[0_18px_50px_rgb(0_0_0/0.25),inset_0_0_0_1px_var(--pl-separator)] [transform-style:preserve-3d]"
            style={{ width, height, zIndex: count - slot }}
          >
            {card}
          </motion.div>
        );
      })}
      {count > 1 && (
        <button
          type="button"
          data-swap-control=""
          onClick={() => (reduced ? setFront((f) => (f + 1) % count) : setPaused(!paused))}
          className="pl-focus-ring pl-touch absolute bottom-0 left-0 h-8 cursor-pointer rounded-full bg-fill-3 px-3 text-footnote text-fg-muted hover:text-fg"
        >
          {reduced ? "Next" : paused ? playLabel : pauseLabel}
        </button>
      )}
    </section>
  );
}
