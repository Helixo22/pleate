// TextCursor: moving the pointer over the area leaves a trail of small text marks that drift and fade.
// The trail is decorative (aria-hidden) and only runs with a fine pointer and motion allowed.
"use client";

import { motion } from "motion/react";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type TextCursorProps = {
  /** What the area contains; the trail draws over it. */
  children?: ReactNode;
  /** The mark left behind. */
  text?: string;
  /** Pixels the pointer moves before a new mark appears. */
  spacing?: number;
  /** Most marks on screen at once. */
  maxPoints?: number;
  /** Seconds a mark takes to fade. */
  duration?: number;
  /** Let marks drift and spin a little at random. */
  randomFloat?: boolean;
  className?: string;
  markClassName?: string;
};

type Mark = { id: number; x: number; y: number; dx: number; dy: number; rotate: number };

export function TextCursor({
  children,
  text = "+",
  spacing = 28,
  maxPoints = 14,
  duration = 0.9,
  randomFloat = true,
  className,
  markClassName = "text-headline text-accent-ink",
}: TextCursorProps) {
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const [marks, setMarks] = useState<Mark[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);
  const nextId = useRef(0);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!fine || reduced) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    if (last.current && Math.hypot(x - last.current.x, y - last.current.y) < spacing) return;
    last.current = { x, y };
    const r = () => (randomFloat ? Math.random() * 2 - 1 : 0);
    const mark = { id: nextId.current++, x, y, dx: r() * 24, dy: r() * 24 - 12, rotate: r() * 45 };
    setMarks((m) => [...m.slice(-(maxPoints - 1)), mark]);
  };

  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={() => (last.current = null)}
      className={cn("relative overflow-hidden", className)}
    >
      {children}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {marks.map((m) => (
          <motion.span
            key={m.id}
            className={cn("absolute top-0 left-0 select-none", markClassName)}
            style={{ x: m.x, y: m.y, translateX: "-50%", translateY: "-50%" }}
            initial={{ opacity: 1, scale: 1, rotate: 0 }}
            animate={{ opacity: 0, scale: 0.4, rotate: m.rotate, x: m.x + m.dx, y: m.y + m.dy }}
            transition={{ duration, ease: "easeOut" }}
            onAnimationComplete={() => setMarks((all) => all.filter((o) => o.id !== m.id))}
          >
            {text}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
