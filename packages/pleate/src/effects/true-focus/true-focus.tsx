// TrueFocus: one word is sharp inside a bracket frame while the others are blurred; the focus moves from word to
// word on a timer, or follows the pointer in manual mode. Reduced motion shows every word sharp, no frame.
"use client";

import { motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type TrueFocusProps = {
  text: string;
  as?: ElementType;
  /** Follow the pointer instead of cycling on a timer. */
  manual?: boolean;
  /** Blur of the unfocused words (px). */
  blur?: number;
  /** Seconds the focus stays on a word. */
  interval?: number;
  /** Seconds the frame takes to move. */
  duration?: number;
  /** Frame color (CSS). */
  color?: string;
  className?: string;
};

type Box = { x: number; y: number; width: number; height: number };

export function TrueFocus({
  text,
  as: Tag = "p",
  manual = false,
  blur = 5,
  interval = 1.4,
  duration = 0.45,
  color = "var(--pl-accent)",
  className,
}: TrueFocusProps) {
  const words = text.split(/\s+/).filter(Boolean);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (manual || reduced) return;
    const id = setInterval(() => setActive((a) => (a + 1) % words.length), interval * 1000);
    return () => clearInterval(id);
  }, [manual, reduced, interval, words.length]);

  useLayoutEffect(() => {
    const measure = () => {
      const el = wordRefs.current[active];
      if (el) setBox({ x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active, text]);

  const pad = 6;
  return (
    <Tag className={cn("relative flex flex-wrap justify-center gap-x-[0.3em] gap-y-2", className)}>
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden="true"
          ref={(el) => {
            wordRefs.current[i] = el;
          }}
          onPointerEnter={manual ? () => setActive(i) : undefined}
          className="relative transition-[filter] ease-out"
          style={{ filter: reduced || i === active ? "none" : `blur(${blur}px)`, transitionDuration: `${duration}s` }}
        >
          {word}
        </span>
      ))}
      {box && !reduced && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0"
          initial={false}
          animate={{ x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 }}
          transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
        >
          {["top-0 left-0 border-t-[3px] border-l-[3px]", "top-0 right-0 border-t-[3px] border-r-[3px]", "bottom-0 left-0 border-b-[3px] border-l-[3px]", "right-0 bottom-0 border-r-[3px] border-b-[3px]"].map((c) => (
            <span key={c} className={cn("absolute size-3 rounded-[3px]", c)} style={{ borderColor: color }} />
          ))}
        </motion.span>
      )}
    </Tag>
  );
}
