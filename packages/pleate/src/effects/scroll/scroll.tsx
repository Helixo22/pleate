// Scroll-driven pieces.
// - SmoothScroll: eases mouse-wheel scrolling of the window. Opt-in; off with reduced motion and on touch.
// - StickyScroll: steps scroll on one side while the visual for the active step stays pinned on the other.
// - HorizontalScroll: a pinned section where scrolling down moves a row of items sideways.
// - ScrollZoom: a framed piece of media that opens up to full width as it scrolls into place.
// All of them render without window access on the server and fall back to plain, readable layouts on phones
// and with reduced motion. Only transform, opacity and clip-path animate.
"use client";

import { motion, useMotionValue, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useIsDesktop, useMediaQuery } from "../../lib/use-media-query.ts";
import { duration, ease } from "../../motion/tokens.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

/* ------------------------------------------------------------------------------------------------ SmoothScroll */

export type SmoothScrollProps = {
  /** Share of the remaining distance covered each frame at 60 fps, 0 to 1. Lower is smoother and slower. */
  lerp?: number;
  wheelMultiplier?: number;
  children?: ReactNode;
};

const SCROLLABLE = /(auto|scroll|overlay)/;

/** True when an element between `from` and the page can still scroll by `dy` itself. */
function innerCanScroll(from: EventTarget | null, dy: number) {
  for (let el = from instanceof Element ? from : null; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    if (el.scrollHeight <= el.clientHeight || !SCROLLABLE.test(getComputedStyle(el).overflowY)) continue;
    if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
  }
  return false;
}

const pageLocked = () =>
  [document.documentElement, document.body].some((el) => /(hidden|clip)/.test(getComputedStyle(el).overflowY));

export function SmoothScroll({ lerp = 0.1, wheelMultiplier = 1, children }: SmoothScrollProps) {
  const reduced = useReducedMotion();
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");

  useEffect(() => {
    if (reduced || !finePointer) return;
    let target = window.scrollY;
    let written = target; // last value this component wrote, to notice scrolling by other means
    let current = target;
    let frame = 0;
    let last = 0;

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const tick = (now: number) => {
      // Anything else moved the page (keyboard, anchor, focus, scrollbar, scrollIntoView): hand over to it.
      if (Math.abs(window.scrollY - written) > 2) return stop();
      const t = 1 - Math.pow(1 - lerp, (Math.max(0, now - last) / 1000) * 60); // same feel at 60 and 120 Hz
      last = now;
      current += (target - current) * t;
      if (Math.abs(target - current) < 0.5) current = target;
      window.scrollTo({ top: current, behavior: "instant" });
      written = window.scrollY;
      frame = current === target ? 0 : requestAnimationFrame(tick);
    };
    const onWheel = (e: WheelEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1) * wheelMultiplier;
      if (!dy || innerCanScroll(e.target, dy) || pageLocked()) return;
      e.preventDefault();
      if (!frame) {
        target = current = written = window.scrollY;
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = Math.min(max, Math.max(0, target + dy));
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", stop);
    window.addEventListener("pointerdown", stop);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", stop);
      window.removeEventListener("pointerdown", stop);
      stop();
    };
  }, [reduced, finePointer, lerp, wheelMultiplier]);

  return <>{children}</>;
}

/* ------------------------------------------------------------------------------------------------ StickyScroll */

export type StickyStep = { id: string; title: ReactNode; body: ReactNode; visual: ReactNode };

export type StickyScrollProps = {
  steps: StickyStep[];
  /** Pixels covered by a sticky header, so the pinned visual sits below it. */
  offset?: number;
  className?: string;
};

export function StickyScroll({ steps, offset = 0, className }: StickyScrollProps) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    // A one-pixel line across the middle of the viewport: the step crossing it is the active one.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(refs.current.indexOf(entry.target as HTMLLIElement));
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [steps.length]);

  return (
    <div className={cn("md:grid md:grid-cols-2 md:gap-12", className)}>
      <ol className="flex flex-col gap-12 md:gap-0">
        {steps.map((step, i) => (
          <li
            key={step.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            aria-current={i === active ? "step" : undefined}
            className="group flex flex-col gap-4 md:min-h-[60vh] md:justify-center md:first:min-h-[40vh] md:first:justify-start md:first:pt-16"
          >
            <div className="flex flex-col gap-2">
              <span aria-hidden="true" className="font-mono text-footnote text-fg-subtle tabular-nums group-aria-[current=step]:text-accent-ink">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-title2 text-fg transition-colors duration-(--pl-duration-base) md:text-fg-subtle md:group-aria-[current=step]:text-fg">
                {step.title}
              </h3>
              <div className="max-w-prose text-body text-fg-muted">{step.body}</div>
            </div>
            <div className="md:hidden">{step.visual}</div>
          </li>
        ))}
      </ol>
      <div className="hidden md:block">
        <div className="sticky flex h-[calc(100dvh-var(--pl-scroll-offset))] items-center" style={{ top: offset, "--pl-scroll-offset": `${offset}px` } as CSSProperties}>
          <div className="grid w-full [&>*]:[grid-area:1/1]">
            {steps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={false}
                animate={{ opacity: i === active ? 1 : 0, y: i === active || reduced ? 0 : 12 }}
                transition={reduced ? { duration: 0 } : { duration: duration.slow, ease: ease.out }}
                className={cn(i !== active && "pointer-events-none")}
              >
                {step.visual}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ HorizontalScroll */

export type HorizontalScrollProps = {
  /** Each child is one item in the row. */
  children: ReactNode;
  /** Pixels between items. */
  gap?: number;
  /** Pixels covered by a sticky header, so the pinned row sits below it. */
  offset?: number;
  /** Accessible name of the row. */
  label?: string;
  className?: string;
};

export function HorizontalScroll({ children, gap = 16, offset = 0, label = "Scrollable row", className }: HorizontalScrollProps) {
  const desktop = useIsDesktop();
  const reduced = useReducedMotion();
  if (desktop && !reduced) return <PinnedRow {...{ gap, offset, label, className }}>{children}</PinnedRow>;
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn("pl-focus-ring flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-2 [&>*]:shrink-0 [&>*]:snap-start", className)}
      style={{ gap, scrollPaddingInline: gap, paddingInline: gap }}
    >
      {children}
    </div>
  );
}

// Separate so useScroll only ever sees a mounted target.
function PinnedRow({ children, gap, offset, label, className }: Required<Omit<HorizontalScrollProps, "className">> & { className?: string }) {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState(0);
  const distance = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: section, offset: [`start ${offset}px`, "end end"] });
  const x = useTransform(() => -scrollYProgress.get() * distance.get());

  useEffect(() => {
    const measure = () => {
      const d = Math.max(0, track.current!.scrollWidth - frame.current!.clientWidth);
      distance.set(d);
      setTravel(d);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(frame.current!);
    observer.observe(track.current!);
    return () => observer.disconnect();
  }, [distance]);

  // Keyboard focus on an item off to the side: scroll the page to the point where that item is in view.
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    const item = [...track.current!.children].find((c) => c.contains(e.target));
    if (!item) return;
    const r = item.getBoundingClientRect();
    const f = frame.current!.getBoundingClientRect();
    if (r.left >= f.left && r.right <= f.right) return;
    const along = Math.min(distance.get(), Math.max(0, r.left - track.current!.getBoundingClientRect().left - gap));
    window.scrollTo({ top: section.current!.getBoundingClientRect().top + window.scrollY - offset + along, behavior: "instant" });
  };

  return (
    <section ref={section} aria-label={label} className={cn("relative", className)} style={{ height: `calc(100dvh - ${offset}px + ${travel}px)` }}>
      <div
        ref={frame}
        onFocus={onFocus}
        className="sticky flex h-[calc(100dvh-var(--pl-scroll-offset))] items-center overflow-clip"
        style={{ top: offset, "--pl-scroll-offset": `${offset}px` } as CSSProperties}
      >
        <motion.div ref={track} style={{ x, gap, paddingInline: gap }} className="flex w-max [&>*]:shrink-0">
          {children}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------ ScrollZoom */

export type ScrollZoomProps = {
  children: ReactNode;
  /** Shown over the bottom edge once the media is fully open. */
  caption?: ReactNode;
  className?: string;
};

export function ScrollZoom({ children, caption, className }: ScrollZoomProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  // From entering the viewport to sitting in its middle.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const clipPath = useTransform(scrollYProgress, (p) => {
    const k = 1 - p;
    return `inset(${k * 4}% ${k * 6}% round ${k * 12}px)`;
  });
  const captionOpacity = useTransform(scrollYProgress, [0.75, 1], [0, 1]);

  return (
    <figure ref={ref} className={cn("relative", className)}>
      <motion.div style={reduced ? undefined : { scale, clipPath }} className="overflow-hidden">
        {children}
      </motion.div>
      {caption && (
        <motion.figcaption
          style={reduced ? undefined : { opacity: captionOpacity }}
          className="absolute inset-x-0 bottom-0 p-4 font-mono text-footnote text-fg md:p-6"
        >
          {caption}
        </motion.figcaption>
      )}
    </figure>
  );
}
