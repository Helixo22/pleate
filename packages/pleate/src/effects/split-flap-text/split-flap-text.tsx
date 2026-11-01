// SplitFlapText: a departures board. Every character is a tile whose flap falls through the alphabet until it lands
// on its letter; change the text and the tiles flip from what they show to the new one. Starts when in view.
// Reduced motion shows the final text; screen readers get the plain text once.
"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type SplitFlapTextProps = {
  text: string;
  /** Characters the flaps cycle through, in order. Text is uppercased when it is all within this set. */
  characters?: string;
  /** Milliseconds per flip. */
  step?: number;
  /** Milliseconds between the start of each tile. */
  stagger?: number;
  className?: string;
  /** Classes for each tile (background, radius, padding). */
  tileClassName?: string;
};

const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.-";
const CSS = `
@keyframes pl-flap-top { from { transform: rotateX(0deg); } to { transform: rotateX(-90deg); } }
@keyframes pl-flap-bottom { from { transform: rotateX(90deg); } to { transform: rotateX(0deg); } }`;

function Half({ ch, bottom, style }: { ch: string; bottom?: boolean; style?: CSSProperties }) {
  return (
    <span
      className={cn("absolute inset-x-0 h-1/2 overflow-hidden bg-inherit backface-hidden", bottom ? "bottom-0 origin-top" : "top-0 origin-bottom")}
      style={style}
    >
      <span className={cn("absolute inset-x-0 flex h-[200%] items-center justify-center", bottom && "-top-full")}>{ch}</span>
    </span>
  );
}

function Tile({ target, chars, step, delay, active, className }: { target: string; chars: string; step: number; delay: number; active: boolean; className?: string }) {
  const reduced = useReducedMotion();
  const [s, set] = useState({ prev: " ", cur: " ", n: 0 });
  useEffect(() => {
    if (!active || s.cur === target) return;
    if (reduced) return set({ prev: target, cur: target, n: 0 });
    const id = setTimeout(
      () =>
        set((p) => {
          const i = chars.indexOf(p.cur);
          const next = i < 0 || !chars.includes(target) ? target : chars[(i + 1) % chars.length];
          return { prev: p.cur, cur: next, n: p.n + 1 };
        }),
      s.n === 0 ? delay : step,
    );
    return () => clearTimeout(id);
  }, [active, s, target, reduced, chars, step, delay]);
  const half = step / 2;
  return (
    <span className={cn("relative inline-block h-[1.3em] w-[1.15ch] rounded-[0.12em] bg-surface-2 text-center [perspective:4em]", className)}>
      <Half ch={s.cur} />
      <Half ch={s.prev} bottom />
      {s.n > 0 && (
        <>
          <Half key={`t${s.n}`} ch={s.prev} style={{ animation: `pl-flap-top ${half}ms ease-in both` }} />
          <Half key={`b${s.n}`} ch={s.cur} bottom style={{ animation: `pl-flap-bottom ${half}ms ${half}ms ease-out both` }} />
        </>
      )}
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-bg/70" />
    </span>
  );
}

export function SplitFlapText({ text, characters = CHARS, step = 70, stagger = 40, className, tileClassName }: SplitFlapTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const upper = text.toUpperCase();
  const shown = [...upper].every((c) => characters.includes(c)) ? upper : text;
  return (
    <span ref={ref} className={cn("inline-flex flex-wrap gap-[0.08em] font-mono font-semibold leading-none", className)}>
      <style href="pl-split-flap" precedence="pleate">
        {CSS}
      </style>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="contents">
        {[...shown].map((ch, i) => (
          <Tile key={i} target={ch} chars={characters} step={step} delay={i * stagger} active={inView} className={tileClassName} />
        ))}
      </span>
    </span>
  );
}
