// AccordionGallery: a row of image panels. The panel under the pointer or keyboard focus grows to show the whole
// picture and its caption, the others shrink to slim strips; the image drifts slightly inside its panel as it opens
// (parallax). Arrow keys move between panels. Narrow screens stack the panels vertically. Reduced motion keeps the
// sizes and drops the transitions.
"use client";

import { useRef, useState, type KeyboardEvent, type CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";

export type AccordionGalleryItem = {
  src: string;
  alt: string;
  title: string;
  caption?: string;
  /** Makes the panel a link. */
  href?: string;
};

export type AccordionGalleryProps = {
  items: AccordionGalleryItem[];
  /** Panel open before any hover or focus. */
  defaultIndex?: number;
  /** Height of the row in px (desktop). */
  height?: number;
  /** How many times wider the open panel is than a closed one. */
  grow?: number;
  /** Accessible name of the gallery. */
  label?: string;
  className?: string;
};

export function AccordionGallery({ items, defaultIndex = 0, height = 420, grow = 5, label = "Gallery", className }: AccordionGalleryProps) {
  const [active, setActive] = useState(defaultIndex);
  const refs = useRef<(HTMLElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, i: number) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    const to = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : step ? (i + step + items.length) % items.length : -1;
    if (to < 0) return;
    event.preventDefault();
    refs.current[to]?.focus();
  };

  return (
    <ul
      aria-label={label}
      className={cn("flex w-full flex-col gap-2 sm:h-[var(--ag-h)] sm:flex-row", className)}
      style={{ "--ag-h": `${height}px` } as CSSProperties}
    >
      {items.map((item, i) => {
        const open = i === active;
        const Tag = item.href ? "a" : "div";
        return (
          <li
            key={item.src + i}
            className="relative min-h-16 min-w-0 transition-[flex-grow,height] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none max-sm:h-[var(--ag-row)] sm:h-full"
            style={{ flexGrow: open ? grow : 1, flexBasis: 0, "--ag-row": open ? "18rem" : "4rem" } as CSSProperties}
          >
            <Tag
              ref={(el: HTMLElement | null) => {
                refs.current[i] = el;
              }}
              href={item.href}
              tabIndex={0}
              aria-current={open || undefined}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onKeyDown={(event: KeyboardEvent) => onKeyDown(event, i)}
              className="pl-focus-ring group/ag relative block size-full overflow-hidden rounded-xl bg-fill-3"
            >
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                draggable={false}
                className="absolute inset-0 size-full scale-110 object-cover transition-[transform,filter] duration-700 ease-out motion-reduce:transition-none"
                style={{ transform: open ? "scale(1.02) translateX(0)" : "scale(1.25) translateX(6%)", filter: open ? "none" : "saturate(0.7) brightness(0.8)" }}
              />
              <div
                aria-hidden={!open || undefined}
                className={cn(
                  "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16 text-white transition-[opacity,translate] duration-500 motion-reduce:transition-none",
                  open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                )}
              >
                <p className="text-title3">{item.title}</p>
                {item.caption && <p className="text-subhead text-white/80">{item.caption}</p>}
              </div>
              {!open && <span className="sr-only">{item.title}</span>}
            </Tag>
          </li>
        );
      })}
    </ul>
  );
}
