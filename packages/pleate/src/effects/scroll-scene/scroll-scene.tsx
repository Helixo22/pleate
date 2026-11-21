// Scroll scenes: a tall section whose stage stays pinned while the page scrolls through it, so the scroll position
// drives whatever the stage shows (a three.js scene, a video frame, a chart).
// - ScrollScene: the section and its pinned stage. Its progress (0 at the top, 1 when the pin ends) is a MotionValue
//   shared with everything inside, so nothing re-renders while scrolling.
// - ScrollBeat: a block of text that shows for one stretch of the progress, rising in and out.
// - useSceneProgress: the enclosing scene's progress, for the stage or anything else inside.
// Keyboard focus on a beat scrolls the page to the stretch where it shows. Reduced motion keeps the scene (the
// scroll is the reader's own movement) but the beats only fade.
"use client";

import { motion, useMotionValue, useScroll, useTransform, type MotionValue } from "motion/react";
import { createContext, useContext, useRef, type CSSProperties, type FocusEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

type SceneContext = { progress: MotionValue<number>; seek: (t: number) => void };

const Scene = createContext<SceneContext | null>(null);

/** The progress (0..1) of the ScrollScene around this component, or a constant 0 outside one. */
export function useSceneProgress(): MotionValue<number> {
  const idle = useMotionValue(0);
  return useContext(Scene)?.progress ?? idle;
}

/* ------------------------------------------------------------------------------------------------ ScrollScene */

export type ScrollSceneProps = {
  /** The pinned layer, full width and height of the viewport: usually a ThreeScene. */
  stage: ReactNode;
  /** Laid over the stage, usually ScrollBeats. */
  children?: ReactNode;
  /** How long the pin lasts, in viewport heights of scrolling. */
  length?: number;
  /** Pixels covered by a sticky header, so the stage sits below it. */
  offset?: number;
  /** Accessible name of the section. */
  label?: string;
  className?: string;
  stageClassName?: string;
};

export function ScrollScene({ stage, children, length = 3, offset = 0, label, className, stageClassName }: ScrollSceneProps) {
  const section = useRef<HTMLElement>(null);
  // From the section's top meeting the header to its bottom meeting the viewport's bottom: exactly the pinned stretch.
  const { scrollYProgress } = useScroll({ target: section, offset: [`start ${offset}px`, "end end"] });

  const seek = (t: number) => {
    const el = section.current;
    if (!el) return;
    const travel = el.offsetHeight - (window.innerHeight - offset);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset + travel * t, behavior: "instant" });
  };

  return (
    <Scene.Provider value={{ progress: scrollYProgress, seek }}>
      <section
        ref={section}
        aria-label={label}
        className={cn("relative", className)}
        style={{ height: `${Math.max(1, length) * 100}dvh` }}
      >
        <div
          className="sticky h-[calc(100dvh-var(--pl-scene-offset))] overflow-clip"
          style={{ top: offset, "--pl-scene-offset": `${offset}px` } as CSSProperties}
        >
          <div className={cn("absolute inset-0", stageClassName)}>{stage}</div>
          {children && <div className="pointer-events-none relative h-full">{children}</div>}
        </div>
      </section>
    </Scene.Provider>
  );
}

/* ------------------------------------------------------------------------------------------------ ScrollBeat */

export type ScrollBeatProps = {
  /** Where it starts to show, 0 to 1 of the scene. */
  from: number;
  /** Where it is gone again. */
  to: number;
  /** Share of the scene spent fading in and out. */
  fade?: number;
  /** Pixels it rises by on the way in and out. */
  distance?: number;
  children: ReactNode;
  className?: string;
};

/**
 * The keyframes of a beat, inside 0..1 (motion hands them to the browser, which rejects anything outside). A beat
 * that starts at 0 is already showing at the top, one that ends at 1 stays to the end.
 */
function beatCurve(from: number, to: number, fade: number) {
  const a = Math.max(0, Math.min(1, from));
  const b = Math.max(a, Math.min(1, to));
  const f = Math.max(0.0001, Math.min(fade, (b - a) / 2));
  const stops: number[] = [];
  const shown: number[] = [];
  const rise: number[] = [];
  const add = (t: number, o: number, r: number) => (stops.push(t), shown.push(o), rise.push(r));
  if (a <= 0) add(0, 1, 0);
  else (add(a, 0, 1), add(a + f, 1, 0));
  if (b >= 1) add(1, 1, 0);
  else (add(b - f, 1, 0), add(b, 0, -1));
  return { stops, shown, rise };
}

export function ScrollBeat({ from, to, fade = 0.04, distance = 16, children, className }: ScrollBeatProps) {
  const context = useContext(Scene);
  const idle = useMotionValue(0);
  const progress = context?.progress ?? idle;
  const reduced = useReducedMotion();
  const { stops, shown, rise } = beatCurve(from, to, fade);
  const opacity = useTransform(progress, stops, shown);
  const y = useTransform(progress, stops, rise.map((r) => (reduced ? 0 : r * distance)));
  // Hidden beats must not catch clicks meant for the stage.
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? "auto" : "none"));

  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    if (opacity.get() > 0.5 || !context) return;
    context.seek((from + to) / 2);
  };

  return (
    // The full-size layer never takes the pointer, so the stage stays usable around the text; only the content does,
    // and only while it shows.
    <motion.div onFocus={onFocus} style={{ opacity, y }} className={cn("pointer-events-none absolute inset-0 flex items-center p-6 md:p-12", className)}>
      <motion.div style={{ pointerEvents }}>{children}</motion.div>
    </motion.div>
  );
}
