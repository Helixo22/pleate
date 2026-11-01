// SwipeStack: a pile of cards you flick through. Drag the top card past the threshold (or click it, or press
// Enter, Space or an arrow key while it is focused) and it tucks under the pile. Cards below sit slightly turned.
// Reduced motion swaps cards without the fling.
"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type SwipeStackProps = {
  cards: ReactNode[];
  /** Drag distance that sends the card back (px). */
  threshold?: number;
  /** Turn the cards below a little (degrees). */
  spread?: number;
  /** Click on the top card sends it back. */
  sendOnClick?: boolean;
  "aria-label"?: string;
  className?: string;
};

function Top({ children, onSend, threshold, sendOnClick, label, focus }: { children: ReactNode; onSend: (key?: boolean) => void; threshold: number; sendOnClick: boolean; label: string; focus: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focus) ref.current?.focus();
  }, [focus]);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const [dragging, setDragging] = useState(false);
  const onEnd = (_: unknown, info: PanInfo) => {
    setTimeout(() => setDragging(false));
    if (Math.hypot(info.offset.x, info.offset.y) > threshold) onSend();
  };
  const onKey = (e: KeyboardEvent) => {
    if (["Enter", " ", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      onSend(true);
    }
  };
  return (
    <motion.div
      ref={ref}
      tabIndex={0}
      role="button"
      aria-label={label}
      drag={!reduced}
      dragSnapToOrigin
      dragElastic={0.6}
      onDragStart={() => setDragging(true)}
      onDragEnd={onEnd}
      onClick={() => !dragging && sendOnClick && onSend()}
      onKeyDown={onKey}
      style={{ x, y, rotate }}
      className="pl-focus-ring absolute inset-0 z-10 cursor-grab rounded-3xl active:cursor-grabbing"
    >
      {children}
    </motion.div>
  );
}

export function SwipeStack({ cards, threshold = 110, spread = 4, sendOnClick = true, className, ...aria }: SwipeStackProps) {
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const keyboard = useRef(false);
  const send = (key = false) => {
    keyboard.current = key;
    setOrder((o) => [...o.slice(1), o[0]]);
  };
  const n = cards.length;
  return (
    <div role="group" aria-roledescription="card stack" aria-label={aria["aria-label"] ?? "Cards"} className={cn("relative aspect-[3/4] w-64 touch-none", className)}>
      {order
        .map((card, depth) => ({ card, depth }))
        .reverse()
        .map(({ card, depth }) =>
          depth === 0 ? (
            <Top key={card} onSend={send} threshold={threshold} sendOnClick={sendOnClick} focus={keyboard.current} label={`Card ${card + 1} of ${n}. Press Enter or drag to see the next.`}>
              <div className="size-full overflow-hidden rounded-3xl shadow-[var(--pl-shadow-xl)]">{cards[card]}</div>
            </Top>
          ) : (
            <motion.div
              key={card}
              aria-hidden="true"
              className="absolute inset-0 overflow-hidden rounded-3xl shadow-[var(--pl-shadow-lg)]"
              animate={{ rotate: (depth % 2 ? 1 : -1) * spread * Math.min(depth, 3), scale: 1 - Math.min(depth, 3) * 0.04, y: Math.min(depth, 3) * 6 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              {cards[card]}
            </motion.div>
          ),
        )}
    </div>
  );
}
