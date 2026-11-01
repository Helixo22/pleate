// TechText: a heads-up-display readout. Monospace text types on behind a blinking block, the newest characters
// still decoding, inside bracket corners with a scanline passing over. Starts when in view. Reduced motion shows
// the final text without the scanline or blink.
"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type TechTextProps = {
  text: string;
  as?: ElementType;
  /** Milliseconds per character. */
  speed?: number;
  /** How many of the newest characters are still scrambled. */
  decode?: number;
  /** Keep the block cursor blinking once typed. */
  cursor?: boolean;
  /** Bracket corners and scanline. */
  frame?: boolean;
  /** Accent for the corners, cursor and scanline (CSS). */
  color?: string;
  characters?: string;
  className?: string;
};

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&/<>[]";
const CSS = `
@keyframes pl-tech-blink { 50% { opacity: 0; } }
@keyframes pl-tech-scan { from { transform: translateY(-100%); } to { transform: translateY(400%); } }`;
const CORNERS = ["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "left-0 bottom-0 border-l border-b", "right-0 bottom-0 border-r border-b"];

export function TechText({ text, as: Tag = "div", speed = 40, decode = 3, cursor = true, frame = true, color = "var(--pl-accent)", characters = CHARS, className }: TechTextProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  const typed = reduced ? text.length + decode : n;
  const done = typed >= text.length + decode;
  useEffect(() => {
    if (!inView || reduced || done) return;
    const id = setTimeout(() => setN((v) => v + 1), speed);
    return () => clearTimeout(id);
  }, [inView, reduced, done, n, speed]);
  const real = Math.max(0, typed - decode);
  const shown = Math.min(typed, text.length);
  return (
    <Tag ref={ref} className={cn("relative inline-block px-[0.9em] py-[0.6em] font-mono tracking-wide", className)}>
      <style href="pl-tech-text" precedence="pleate">
        {CSS}
      </style>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="whitespace-pre-wrap">
        {text.slice(0, real)}
        <span style={{ color }}>
          {[...text.slice(real, shown)].map((ch, i) => (ch === " " ? ch : characters[(real + i * 7 + n * 13) % characters.length]))}
        </span>
        {(!done || cursor) && (
          <span className="relative inline-block w-0 overflow-visible align-baseline">
            <span
              className="absolute bottom-[-0.15em] left-[0.05em] h-[1.1em] w-[0.6em]"
              style={{ background: color, animation: reduced || !done ? undefined : "pl-tech-blink 1s steps(1) infinite", opacity: reduced ? 0 : 1 }}
            />
          </span>
        )}
        <span className="invisible">{text.slice(shown)}</span>
      </span>
      {frame && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          {CORNERS.map((c) => (
            <span key={c} className={cn("absolute size-[0.7em]", c)} style={{ borderColor: color }} />
          ))}
          {!reduced && (
            <span className="absolute inset-0 overflow-hidden">
              <span
                className="absolute inset-x-0 top-0 h-1/4 opacity-25"
                style={{ background: `linear-gradient(to bottom, transparent, ${color})`, animation: "pl-tech-scan 2.8s linear infinite" }}
              />
            </span>
          )}
        </span>
      )}
    </Tag>
  );
}
