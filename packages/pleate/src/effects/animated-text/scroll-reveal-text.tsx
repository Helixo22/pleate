// ScrollRevealText: a paragraph whose words light up one by one as it scrolls through the viewport, the large
// statement style of product pages. Static and fully lit with reduced motion.
"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return <motion.span style={{ opacity }}>{children}</motion.span>;
}

export type ScrollRevealTextProps = { text: string; as?: ElementType; className?: string };

export function ScrollRevealText({ text, as: Tag = "p", className }: ScrollRevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(/(\s+)/);
  const count = words.filter((w) => w.trim()).length;
  let n = 0;
  return (
    <Tag ref={ref} className={cn(className)}>
      {reduced ? (
        text
      ) : (
        <>
          <span className="sr-only">{text}</span>
          <span aria-hidden="true">
            {words.map((w, i) => {
              if (!w.trim()) return w;
              const start = n / count;
              n += 1;
              return (
                <Word key={i} progress={scrollYProgress} range={[start, Math.min(1, start + 1.5 / count)]}>
                  {w}
                </Word>
              );
            })}
          </span>
        </>
      )}
    </Tag>
  );
}
