// FeatureGrid: what a product does, in a grid. "cards" on solid surfaces, "plain" on the page, or "bento" where
// items can span columns/rows and carry a visual. Each item: icon tile, title, text, optional link. Items enter
// one after another as the grid scrolls in.
"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronRightIcon } from "../../lib/icons.tsx";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type Feature = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  href?: string;
  linkLabel?: ReactNode;
  /** Bento: a visual under the text. */
  media?: ReactNode;
  /** Bento: columns / rows this item spans (on large screens). */
  span?: 1 | 2;
  rowSpan?: 1 | 2;
};

export type FeatureGridProps = {
  features: Feature[];
  columns?: 2 | 3 | 4;
  variant?: "cards" | "plain" | "bento";
  className?: string;
};

const COLS = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" } as const;

export function FeatureGrid({ features, columns = 3, variant = "cards", className }: FeatureGridProps) {
  const reduced = useReducedMotion();
  return (
    <motion.ul
      className={cn("grid gap-4", COLS[columns], variant === "bento" && "lg:auto-rows-[minmax(12rem,auto)]", variant === "plain" && "gap-x-8 gap-y-10", className)}
      initial={reduced ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.07 } } }}
    >
      {features.map((f, i) => (
        <motion.li
          key={i}
          variants={{ hidden: { opacity: 0, y: 22 }, shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }}
          className={cn(
            "group relative flex flex-col gap-3",
            variant !== "plain" && "overflow-hidden rounded-3xl bg-surface p-6 shadow-xs",
            variant === "bento" && f.span === 2 && "lg:col-span-2",
            variant === "bento" && f.rowSpan === 2 && "lg:row-span-2",
            f.href && "transition-shadow duration-(--pl-duration-base) hover:shadow-md",
          )}
        >
          {f.icon && (
            <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent-ink [&_svg]:size-[1.375rem]">{f.icon}</span>
          )}
          <h3 className="text-headline text-fg">
            {f.href ? (
              <a href={f.href} className="pl-focus-ring rounded-xs after:absolute after:inset-0 after:content-['']">
                {f.title}
              </a>
            ) : (
              f.title
            )}
          </h3>
          {f.description && <p className="text-subhead text-pretty text-fg-muted">{f.description}</p>}
          {f.href && (
            <span aria-hidden="true" className="mt-auto inline-flex items-center gap-0.5 text-subhead font-semibold text-accent-ink">
              {f.linkLabel ?? "Learn more"}
              <ChevronRightIcon className="size-4 transition-[translate] duration-(--pl-duration-fast) group-hover:translate-x-0.5 rtl:rotate-180" strokeWidth={2.5} />
            </span>
          )}
          {f.media && <div className="-mx-6 -mb-6 mt-auto pt-2">{f.media}</div>}
        </motion.li>
      ))}
    </motion.ul>
  );
}
