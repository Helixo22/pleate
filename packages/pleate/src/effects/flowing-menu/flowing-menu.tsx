// FlowingMenu: a stack of big text links. Hovering a row slides a colored band in from the edge the pointer came
// through (top or bottom), carrying a scrolling marquee of the label and a picture; leaving slides it out the way
// the pointer goes. Keyboard focus shows the band too. The marquee is decorative; each row is a plain link.
// Reduced motion shows the band without the slide and keeps the marquee still.
"use client";

import { useState, type CSSProperties, type PointerEvent } from "react";
import { cn } from "../../lib/cn.ts";

export type FlowingMenuItem = { label: string; href: string; image?: string };

export type FlowingMenuProps = {
  items: FlowingMenuItem[];
  /** Band color (CSS); defaults to the accent. */
  bandColor?: string;
  /** Text color on the band (CSS). */
  bandText?: string;
  /** Seconds for one marquee loop. */
  speed?: number;
  /** Accessible name of the navigation. */
  label?: string;
  className?: string;
};

export function FlowingMenu({ items, bandColor = "var(--pl-accent)", bandText = "var(--pl-on-accent, #fff)", speed = 12, label = "Menu", className }: FlowingMenuProps) {
  return (
    <nav aria-label={label} className={cn("w-full overflow-hidden rounded-2xl bg-surface", className)}>
      <ul>
        {items.map((item) => (
          <Row key={item.href + item.label} item={item} bandColor={bandColor} bandText={bandText} speed={speed} />
        ))}
      </ul>
    </nav>
  );
}

function Row({ item, bandColor, bandText, speed }: { item: FlowingMenuItem; bandColor: string; bandText: string; speed: number }) {
  // "top" / "bottom": where the band is parked; null: shown.
  const [band, setBandState] = useState<"top" | "bottom" | null>("top");
  const [slide, setSlide] = useState(true);
  const setBand = (to: "top" | "bottom" | null, animated = true) => {
    setSlide(animated);
    setBandState(to);
  };
  const edge = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return event.clientY - box.top < box.height / 2 ? "top" : "bottom";
  };
  const parked = band === "top" ? "-101%" : band === "bottom" ? "101%" : "0%";

  return (
    <li className="relative border-t border-separator first:border-t-0">
      <a
        href={item.href}
        onPointerEnter={(event) => {
          // Park the band on the entry edge first, then let it slide in on the next frame.
          const from = edge(event);
          setBand(from, false);
          requestAnimationFrame(() => requestAnimationFrame(() => setBand(null)));
        }}
        onPointerLeave={(event) => setBand(edge(event))}
        onFocus={() => setBand(null)}
        onBlur={() => setBand("top")}
        className="pl-focus-ring relative flex h-20 outline-offset-[-3px] items-center justify-center overflow-hidden text-title1 font-semibold text-fg sm:h-24 sm:text-large-title"
      >
        {item.label}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center overflow-hidden ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none",
            slide && "transition-transform duration-500",
          )}
          style={{ background: bandColor, color: bandText, transform: `translateY(${parked})` }}
        >
          <span className="flex w-max" style={{ "--fm-d": `${speed}s` } as CSSProperties}>
            {[0, 1].map((copy) => (
              <span key={copy} className="flex shrink-0 items-center motion-safe:animate-[pl-marquee_var(--fm-d)_linear_infinite]">
                {Array.from({ length: 4 }, (_, i) => (
                  <span key={i} className="flex shrink-0 items-center gap-6 pr-6">
                    <span className="whitespace-nowrap">{item.label}</span>
                    {item.image ? (
                      <img src={item.image} alt="" className="h-12 w-24 rounded-full object-cover sm:h-14 sm:w-32" />
                    ) : (
                      <span className="size-3 rounded-full bg-current" />
                    )}
                  </span>
                ))}
              </span>
            ))}
          </span>
        </span>
      </a>
    </li>
  );
}
