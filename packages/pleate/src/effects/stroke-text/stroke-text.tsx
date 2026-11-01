// StrokeText: the outline of each letter is drawn on, then the letters fill in. Scales with the surrounding font
// size. Starts when in view; reduced motion shows the filled text. Screen readers get the plain text once.
"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type StrokeTextProps = {
  text: string;
  as?: ElementType;
  /** Seconds to draw the outlines. */
  duration?: number;
  delay?: number;
  /** Outline color (CSS); default the palette accent. */
  stroke?: string;
  /** Fill color once drawn; "none" keeps it an outline. */
  fill?: string;
  /** Outline width, in hundredths of the font size. */
  strokeWidth?: number;
  className?: string;
};

// Font size inside the drawing; outlines restart their dash per glyph, so one long dash covers any letter.
const SIZE = 100;
const DASH = 1000;

export function StrokeText({ text, as: Tag = "span", duration = 1.8, delay = 0, stroke = "var(--pl-accent)", fill = "var(--pl-fg)", strokeWidth = 1.5, className }: StrokeTextProps) {
  const ref = useRef<SVGTextElement>(null);
  const wrap = useRef<HTMLElement>(null);
  const inView = useInView(wrap, { once: true });
  const reduced = useReducedMotion();
  const [box, setBox] = useState({ x: 0, y: -SIZE, width: SIZE * text.length * 0.6, height: SIZE * 1.2 });
  const measure = () => {
    if (ref.current) setBox(ref.current.getBBox());
  };
  useLayoutEffect(measure, [text]);
  useEffect(() => {
    document.fonts?.ready.then(measure);
  }, [text]);
  const pad = strokeWidth * 2;
  const on = inView || reduced;
  return (
    <Tag ref={wrap} className={cn("inline-block align-baseline", className)}>
      <span className="sr-only">{text}</span>
      <svg
        aria-hidden="true"
        viewBox={`${box.x - pad} ${box.y - pad} ${box.width + pad * 2} ${box.height + pad * 2}`}
        className="inline-block overflow-visible align-[-0.2em]"
        style={{ height: `${(box.height + pad * 2) / SIZE}em`, width: "auto" }}
      >
        <motion.text
          ref={ref}
          fontSize={SIZE}
          xmlSpace="preserve"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={`${DASH} ${DASH}`}
          strokeLinejoin="round"
          initial={reduced ? false : { strokeDashoffset: DASH, fillOpacity: 0 }}
          animate={on ? { strokeDashoffset: 0, fillOpacity: fill === "none" ? 0 : 1 } : undefined}
          transition={{
            strokeDashoffset: { duration, delay, ease: [0.65, 0, 0.35, 1] },
            fillOpacity: { duration: 0.6, delay: delay + duration * 0.8 },
          }}
          style={{ fill: fill === "none" ? "transparent" : fill }}
        >
          {text}
        </motion.text>
      </svg>
    </Tag>
  );
}
