// TextType: a typewriter. Types a sentence, waits, deletes it and types the next one, with a blinking cursor.
// Screen readers get every sentence once; reduced motion shows the first sentence complete, without the cursor.
"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type TextTypeProps = {
  /** One sentence, or several to cycle through. */
  text: string | string[];
  as?: ElementType;
  /** Milliseconds per typed character. */
  typingSpeed?: number;
  /** Milliseconds per deleted character. */
  deletingSpeed?: number;
  /** Milliseconds a finished sentence stays before it is deleted. */
  pause?: number;
  /** Start over after the last sentence; when false it stops on the last one. */
  loop?: boolean;
  /** Wait until the text is on screen before typing. */
  startOnView?: boolean;
  cursor?: string;
  showCursor?: boolean;
  className?: string;
  cursorClassName?: string;
};

export function TextType({
  text,
  as: Tag = "span",
  typingSpeed = 55,
  deletingSpeed = 30,
  pause = 1600,
  loop = true,
  startOnView = true,
  cursor = "|",
  showCursor = true,
  className,
  cursorClassName = "text-accent-ink",
}: TextTypeProps) {
  const lines = Array.isArray(text) ? text : [text];
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const current = lines[index % lines.length] ?? "";
  const started = !startOnView || inView;
  const done = !loop && index === lines.length - 1 && count === current.length;

  useEffect(() => {
    if (reduced || !started || done) return;
    let wait = deleting ? deletingSpeed : typingSpeed;
    if (!deleting && count === current.length) wait = pause;
    const id = setTimeout(() => {
      if (!deleting && count < current.length) setCount(count + 1);
      else if (!deleting) setDeleting(lines.length > 1 || loop);
      else if (count > 0) setCount(count - 1);
      else {
        setDeleting(false);
        setIndex((i) => (i + 1) % lines.length);
      }
    }, wait);
    return () => clearTimeout(id);
  }, [reduced, started, done, deleting, count, current.length, typingSpeed, deletingSpeed, pause, lines.length, loop]);

  const shown = reduced ? (lines[0] ?? "") : current.slice(0, count);
  return (
    <Tag ref={ref} className={cn("whitespace-pre-wrap", className)}>
      <span className="sr-only">{lines.join(". ")}</span>
      <span aria-hidden="true">
        {shown}
        {showCursor && !reduced && (
          <motion.span
            className={cn("ml-0.5 inline-block", cursorClassName)}
            animate={{ opacity: [1, 1, 0, 0] }}
            transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
          >
            {cursor}
          </motion.span>
        )}
      </span>
    </Tag>
  );
}
