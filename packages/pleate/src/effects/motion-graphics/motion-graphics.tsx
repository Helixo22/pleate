// Motion graphics: small animated pieces that explain something. DrawPath draws SVG strokes on view, FlowLine sends a
// pulse along a path (data moving between two things), Orbit circles items around a center, Odometer rolls each digit
// to a new number, Waveform shows a live voice level, StatusMark draws pending/success/error/warning marks.
// Every piece honours reduced motion (final state, no loops) and keeps a plain-text meaning for screen readers.
"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { Children, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

const EASE = [0.22, 1, 0.36, 1] as const;
const list = (d: string | string[]) => (Array.isArray(d) ? d : [d]);

/* ------------------------------------------------------------------------------------------------ DrawPath */

export type DrawPathProps = {
  /** One path or several, drawn in order. */
  d: string | string[];
  viewBox: string;
  /** Seconds per path. */
  duration?: number;
  delay?: number;
  /** Seconds between consecutive paths. */
  stagger?: number;
  strokeWidth?: number;
  /** Draw again every time it enters the viewport. */
  once?: boolean;
  /** Accessible name; without it the drawing is decorative. */
  label?: string;
  className?: string;
};

export function DrawPath({ d, viewBox, duration = 1.4, delay = 0, stagger = 0.25, strokeWidth = 1.5, once = true, label, className }: DrawPathProps) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();
  const drawn = reduced || inView;
  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      className={cn("block text-fg", className)}
    >
      {list(d).map((path, i) => (
        <motion.path
          key={i}
          d={path}
          initial={false}
          animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
          transition={reduced ? { duration: 0 } : { duration, delay: delay + i * stagger, ease: EASE }}
        />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------------------------------------ FlowLine */

export type FlowLineProps = {
  d: string | string[];
  viewBox: string;
  /** Seconds for a pulse to travel the whole path. */
  duration?: number;
  /** Pulse length as a share of the path, 0 to 1. */
  length?: number;
  /** Travel from the end to the start. */
  reverse?: boolean;
  strokeWidth?: number;
  /** Stop the pulse (for example while nothing is flowing). */
  paused?: boolean;
  label?: string;
  className?: string;
};

export function FlowLine({ d, viewBox, duration = 2.4, length = 0.18, reverse = false, strokeWidth = 1.5, paused = false, label, className }: FlowLineProps) {
  const reduced = useReducedMotion();
  // pathLength=100 normalises every path, so the dash maths is the same whatever its real length.
  const dash = Math.max(1, Math.min(99, length * 100));
  const style = {
    // The dash sits at path position -offset: travel from just before the start (dash) past the end (-100).
    "--pl-flow-from": reverse ? "-100" : `${dash}`,
    "--pl-flow-to": reverse ? `${dash}` : "-100",
  } as CSSProperties;
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      className={cn("block", className)}
      style={style}
    >
      {list(d).map((path, i) => (
        <g key={i}>
          <path d={path} stroke="var(--pl-border)" pathLength={100} />
          {!reduced && !paused && (
            <path
              d={path}
              stroke="var(--pl-accent-ink)"
              pathLength={100}
              strokeDasharray={`${dash} ${200}`}
              style={{ animation: `pl-flow ${duration}s linear ${(i * duration) / 3}s infinite both` }}
            />
          )}
        </g>
      ))}
    </svg>
  );
}

/* --------------------------------------------------------------------------------------------------- Orbit */

export type OrbitProps = {
  /** Square size of the scene in px. */
  size?: number;
  /** What sits in the middle (a logo, an avatar, a number). */
  center?: ReactNode;
  /** OrbitRing children. */
  children: ReactNode;
  /** Stop every ring while the pointer is over the scene. */
  pauseOnHover?: boolean;
  label?: string;
  className?: string;
};

export function Orbit({ size = 320, center, children, pauseOnHover = true, label, className }: OrbitProps) {
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      className={cn("relative grid shrink-0 place-items-center", pauseOnHover && "[&:hover_.pl-orbit]:[animation-play-state:paused]", className)}
      style={{ width: size, height: size }}
    >
      {children}
      {center && <div className="relative z-10">{center}</div>}
    </div>
  );
}

export type OrbitRingProps = {
  radius: number;
  /** Seconds per turn. */
  duration?: number;
  reverse?: boolean;
  /** Draw the hairline track. */
  track?: boolean;
  /** Items placed evenly on the ring; they stay upright while it turns. */
  children: ReactNode;
};

export function OrbitRing({ radius, duration = 24, reverse = false, track = true, children }: OrbitRingProps) {
  const items = Children.toArray(children);
  const spin = `pl-spin ${duration}s linear infinite${reverse ? " reverse" : ""}`;
  const counter = `pl-spin ${duration}s linear infinite${reverse ? "" : " reverse"}`;
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      {track && (
        <div aria-hidden="true" className="absolute rounded-full shadow-[inset_0_0_0_1px_var(--pl-separator)]" style={{ width: radius * 2, height: radius * 2 }} />
      )}
      <div className="pl-orbit absolute size-0" style={{ animation: spin }}>
        {items.map((item, i) => {
          const angle = (360 / items.length) * i;
          return (
            <div key={i} className="absolute" style={{ transform: `rotate(${angle}deg) translateX(${radius}px) rotate(${-angle}deg)` }}>
              <div className="pl-orbit pointer-events-auto -translate-x-1/2 -translate-y-1/2" style={{ animation: counter }}>
                {item}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ Odometer */

export type OdometerProps = {
  value: number;
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** Seconds for a digit to roll. */
  duration?: number;
  className?: string;
};

const DIGITS = "0123456789";

export function Odometer({ value, format, locale, duration = 0.7, className }: OdometerProps) {
  const fmt = useMemo(() => new Intl.NumberFormat(locale, format), [locale, format]);
  const text = fmt.format(value);
  const chars = [...text];
  return (
    <span className={cn("pl-tabular inline-flex leading-none", className)}>
      <span aria-hidden="true" className="inline-flex overflow-hidden">
        {chars.map((ch, i) => {
          // Keyed from the right so the ones column stays the ones column when the number grows.
          const key = chars.length - i;
          const digit = DIGITS.indexOf(ch);
          if (digit < 0) return <span key={`s${key}`}>{ch}</span>;
          return (
            <span key={key} className="relative inline-block h-[1em] overflow-hidden">
              <span className="invisible">0</span>
              <span
                className="absolute inset-x-0 top-0 flex flex-col transition-transform ease-out motion-reduce:transition-none"
                style={{ transform: `translateY(${-digit}em)`, transitionDuration: `${duration + (chars.length - i) * 0.04}s` }}
              >
                {[...DIGITS].map((d) => (
                  <span key={d} className="h-[1em]">
                    {d}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------ Waveform */

export type WaveformProps = {
  /** Animate as if sound is coming in. */
  active?: boolean;
  /** Real levels from 0 to 1 (for example from an AnalyserNode); overrides the idle animation. */
  levels?: number[];
  bars?: number;
  /** Height in px. */
  height?: number;
  label?: string;
  className?: string;
};

export function Waveform({ active = true, levels, bars = 24, height = 32, label, className }: WaveformProps) {
  const reduced = useReducedMotion();
  const count = levels?.length ?? bars;
  return (
    <div
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      className={cn("flex items-center gap-[3px] text-accent-ink", className)}
      style={{ height }}
    >
      {Array.from({ length: count }, (_, i) => {
        // A fixed, uneven silhouette so idle bars look like speech, not a sine wave.
        // Rounded so server and client render the same style string.
        const shape = Math.round((0.35 + 0.65 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6))) * 1000) / 1000;
        const level = levels ? Math.round(Math.max(0.06, Math.min(1, levels[i] ?? 0)) * 1000) / 1000 : active ? shape : 0.12;
        const animated = !levels && active && !reduced;
        return (
          <span
            key={i}
            className="h-full w-[3px] origin-center rounded-full bg-current transition-transform duration-150 ease-out"
            style={
              animated
                ? ({ "--pl-wave-lo": 0.15, animation: `pl-wave ${(800 + (i % 5) * 130)}ms ease-in-out ${(i % 7) * -110}ms infinite`, transform: `scaleY(${level})` } as CSSProperties)
                : { transform: `scaleY(${level})`, opacity: active || levels ? 1 : 0.45 }
            }
          />
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- StatusMark */

export type Status = "pending" | "success" | "error" | "warning";

const MARK: Record<Exclude<Status, "pending">, { color: string; glyph: string; label: string }> = {
  success: { color: "text-success-ink", glyph: "M8 12.5l2.75 2.75L16 9.5", label: "Done" },
  error: { color: "text-danger-ink", glyph: "M9 9l6 6M15 9l-6 6", label: "Failed" },
  warning: { color: "text-warning-ink", glyph: "M12 7.5v5.5M12 16.5v.01", label: "Needs attention" },
};

export type StatusMarkProps = {
  status: Status;
  /** px */
  size?: number;
  /** Overrides the default spoken status ("Done", "Failed"…). */
  label?: string;
  className?: string;
};

export function StatusMark({ status, size = 24, label, className }: StatusMarkProps) {
  const reduced = useReducedMotion();
  const draw = (delay: number) =>
    reduced ? { duration: 0 } : { pathLength: { duration: 0.45, delay, ease: EASE }, opacity: { duration: 0.1, delay } };
  const mark = status === "pending" ? null : MARK[status];
  return (
    <span
      role="status"
      aria-label={label ?? mark?.label ?? "In progress"}
      className={cn("relative inline-grid shrink-0 place-items-center", mark ? mark.color : "text-fg-subtle", className)}
      style={{ width: size, height: size }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {status === "pending" ? (
          <motion.svg key="pending" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-full" exit={{ opacity: 0 }}>
            <circle cx="12" cy="12" r="9" opacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" className="origin-center animate-[pl-spin_0.8s_linear_infinite]" />
          </motion.svg>
        ) : (
          <motion.svg key={status} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-full" exit={{ opacity: 0 }}>
            <motion.circle cx="12" cy="12" r="9" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={draw(0)} style={{ rotate: -90 }} />
            <motion.path d={mark!.glyph} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={draw(0.3)} />
          </motion.svg>
        )}
      </AnimatePresence>
    </span>
  );
}
