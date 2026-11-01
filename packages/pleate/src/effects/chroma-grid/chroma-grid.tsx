// ChromaGrid: a grid of profile cards shown in grayscale, with a circle of full color following the pointer
// across the whole grid. The card under the pointer (or keyboard focus) turns fully colored and its border lights
// up near the pointer. Touch screens and reduced motion show the cards in color, without the spotlight.
"use client";

import { useRef, type CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type ChromaGridItem = {
  image: string;
  alt: string;
  title: string;
  subtitle?: string;
  handle?: string;
  /** Makes the card a link. */
  href?: string;
  /** Card tint and border light (CSS); defaults to the accent. */
  color?: string;
};

export type ChromaGridProps = {
  items: ChromaGridItem[];
  /** Radius of the color spotlight, px. */
  radius?: number;
  /** Minimum card width, px. */
  minCardWidth?: number;
  className?: string;
};

export function ChromaGrid({ items, radius = 260, minCardWidth = 220, className }: ChromaGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const live = fine && !reduced;

  const mask = `radial-gradient(circle ${radius}px at var(--cg-x) var(--cg-y), transparent 0%, transparent 15%, rgb(0 0 0 / 0.1) 30%, rgb(0 0 0 / 0.35) 50%, rgb(0 0 0 / 0.65) 75%, #000 100%)`;
  return (
    <div
      ref={ref}
      onPointerMove={(event) => {
        if (!live || !ref.current) return;
        const box = ref.current.getBoundingClientRect();
        ref.current.style.setProperty("--cg-x", `${event.clientX - box.left}px`);
        ref.current.style.setProperty("--cg-y", `${event.clientY - box.top}px`);
      }}
      onPointerLeave={() => ref.current?.style.setProperty("--cg-x", "-9999px")}
      className={cn("relative isolate grid w-full gap-3", className)}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${minCardWidth}px, 100%), 1fr))`, "--cg-x": "-9999px", "--cg-y": "50%" } as CSSProperties}
    >
      {items.map((item, i) => {
        const Tag = item.href ? "a" : "article";
        return (
          <Tag
            key={item.title + i}
            href={item.href}
            onPointerMove={(event) => {
              const el = event.currentTarget;
              const box = el.getBoundingClientRect();
              el.style.setProperty("--card-x", `${event.clientX - box.left}px`);
              el.style.setProperty("--card-y", `${event.clientY - box.top}px`);
            }}
            className="pl-focus-ring group/cg relative flex flex-col overflow-hidden rounded-2xl p-1.5 transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none"
            style={{ background: `linear-gradient(160deg, color-mix(in oklab, ${item.color ?? "var(--pl-accent)"} 45%, var(--pl-surface)), var(--pl-surface) 70%)`, "--card-c": item.color ?? "var(--pl-accent)" } as CSSProperties}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/cg:opacity-100"
              style={{
                padding: 1.5,
                background: "radial-gradient(240px circle at var(--card-x) var(--card-y), var(--card-c), transparent 70%)",
                mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
                WebkitMask: "linear-gradient(#000 0 0) content-box xor, linear-gradient(#000 0 0)",
              }}
            />
            <img src={item.image} alt={item.alt} loading="lazy" className="aspect-[4/5] w-full rounded-xl object-cover" />
            <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-2 px-2.5 pt-3 pb-2 text-fg">
              <h3 className="truncate text-headline">{item.title}</h3>
              {item.handle && <span className="text-footnote text-fg-muted">{item.handle}</span>}
              {item.subtitle && <p className="col-span-2 truncate text-subhead text-fg-muted">{item.subtitle}</p>}
            </div>
          </Tag>
        );
      })}
      {live && (
        <>
          {/* Grayscale everywhere except the circle around the pointer. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 backdrop-grayscale backdrop-brightness-[0.85]" style={{ mask, WebkitMask: mask }} />
        </>
      )}
    </div>
  );
}
