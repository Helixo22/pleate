// Masonry: an image wall that packs items into the shortest column, reflows smoothly when the width changes, and
// lets items rise in one after another the first time it scrolls into view. Hover lifts an item a little.
// Items with an href are links; the rest are plain figures. Reduced motion places everything at once.
"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type MasonryItem = {
  id: string;
  src: string;
  alt: string;
  /** Height divided by width. */
  ratio: number;
  href?: string;
};

export type MasonryProps = {
  items: MasonryItem[];
  /** Columns by container width: [minWidth px, columns], checked from the widest. */
  breakpoints?: [number, number][];
  /** Gap (px). */
  gap?: number;
  /** Delay between items on entry (s). */
  stagger?: number;
  className?: string;
};

export function Masonry({ items, breakpoints = [[900, 4], [600, 3], [0, 2]], gap = 12, stagger = 0.05, className }: MasonryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const reduced = useReducedMotion();
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const { boxes, height } = useMemo(() => {
    const cols = [...breakpoints].sort((a, b) => b[0] - a[0]).find(([min]) => width >= min)?.[1] ?? 1;
    const w = (width - gap * (cols - 1)) / cols;
    const tops = Array<number>(cols).fill(0);
    const boxes = items.map((item) => {
      const c = tops.indexOf(Math.min(...tops));
      const box = { x: c * (w + gap), y: tops[c], w, h: w * item.ratio };
      tops[c] += box.h + gap;
      return box;
    });
    return { boxes, height: Math.max(0, ...tops) - gap };
  }, [items, width, gap, breakpoints]);

  return (
    <div ref={ref} className={cn("relative w-full", className)} style={{ height: width ? height : undefined }}>
      {width > 0 &&
        items.map((item, i) => {
          const b = boxes[i];
          const img = <img src={item.src} alt={item.alt} loading="lazy" className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />;
          return (
            <motion.div
              key={item.id}
              className="absolute"
              initial={reduced ? false : { opacity: 0, y: 60 }}
              animate={inView || reduced ? { opacity: 1, y: 0, left: b.x, top: b.y, width: b.w, height: b.h } : { left: b.x, top: b.y, width: b.w, height: b.h }}
              transition={{ duration: reduced ? 0 : 0.6, ease: [0.22, 1, 0.36, 1], delay: inView ? i * stagger : 0, left: { duration: 0.4 }, top: { duration: 0.4 } }}
            >
              {item.href ? (
                <a href={item.href} className="group pl-focus-ring block size-full overflow-hidden rounded-2xl bg-fill shadow-[var(--pl-shadow-sm)]">{img}</a>
              ) : (
                <figure className="group size-full overflow-hidden rounded-2xl bg-fill shadow-[var(--pl-shadow-sm)]">{img}</figure>
              )}
            </motion.div>
          );
        })}
    </div>
  );
}
