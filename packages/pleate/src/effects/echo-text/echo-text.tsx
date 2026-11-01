// EchoText: fading copies of the text trail behind it and breathe outward and back, like an echo. Reduced motion
// leaves the copies resting at their offset. The copies are decorative; the real text is read once.
"use client";

import type { CSSProperties, ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type EchoTextProps = {
  text: string;
  as?: ElementType;
  /** Number of trailing copies. */
  copies?: number;
  /** Offset of each copy from the previous one, in em. */
  x?: number;
  y?: number;
  /** Color of the copies (CSS); default the palette accent. */
  color?: string;
  /** Seconds per pulse. */
  duration?: number;
  className?: string;
};

const CSS = `@keyframes pl-echo { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(var(--pl-echo-x), var(--pl-echo-y)); } }`;

export function EchoText({ text, as: Tag = "span", copies = 4, x = 0.06, y = 0.06, color = "var(--pl-accent)", duration = 2.4, className }: EchoTextProps) {
  const reduced = useReducedMotion();
  return (
    <Tag className={cn("relative inline-block", className)}>
      <style href="pl-echo-text" precedence="pleate">
        {CSS}
      </style>
      {Array.from({ length: copies }, (_, k) => {
        const i = copies - k;
        const style = {
          color,
          opacity: 0.5 * (1 - i / (copies + 1)),
          "--pl-echo-x": `${x * i}em`,
          "--pl-echo-y": `${y * i}em`,
          transform: reduced ? `translate(${x * i}em, ${y * i}em)` : undefined,
          animation: reduced ? undefined : `pl-echo ${duration}s ${i * 0.06}s cubic-bezier(0.45, 0, 0.55, 1) infinite`,
        } as CSSProperties;
        return (
          <span key={i} aria-hidden="true" className="pointer-events-none absolute inset-0 select-none" style={style}>
            {text}
          </span>
        );
      })}
      <span className="relative">{text}</span>
    </Tag>
  );
}
