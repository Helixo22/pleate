// Testimonials. TestimonialCard: a quote with its author, role, avatar and an optional star rating.
// Testimonials lays several out as a "grid" (balanced columns), a "carousel" (swipe/scroll with snap and arrow
// buttons) or one "featured" large quote.
"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronRightIcon } from "../../lib/icons.tsx";
import { Avatar } from "../../components/avatar/avatar.tsx";

export type Testimonial = {
  quote: ReactNode;
  name: string;
  role?: ReactNode;
  avatar?: string;
  /** 1–5. */
  rating?: number;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5 text-warning-ink" role="img" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={cn("size-4", i >= Math.round(rating) && "opacity-25")} fill="currentColor" aria-hidden="true">
          <path d="M10 1.8l2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.6-5 2.6 1-5.6-4-3.9 5.5-.8z" />
        </svg>
      ))}
    </span>
  );
}

export function TestimonialCard({ quote, name, role, avatar, rating, className }: Testimonial & { className?: string }) {
  return (
    <figure className={cn("flex flex-col gap-4 rounded-3xl bg-surface p-6 shadow-xs", className)}>
      {rating !== undefined && <Stars rating={rating} />}
      <blockquote className="text-body text-pretty text-fg">{quote}</blockquote>
      <figcaption className="mt-auto flex items-center gap-3">
        <Avatar src={avatar} name={name} size="md" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-subhead font-semibold">{name}</span>
          {role && <span className="truncate text-footnote text-fg-muted">{role}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

export type TestimonialsProps = {
  items: Testimonial[];
  layout?: "grid" | "carousel" | "featured";
  label?: string;
  className?: string;
};

export function Testimonials({ items, layout = "grid", label = "Testimonials", className }: TestimonialsProps) {
  const track = useRef<HTMLUListElement>(null);
  if (layout === "featured") {
    const t = items[0];
    return (
      <figure className={cn("mx-auto flex max-w-3xl flex-col items-center gap-8 text-center", className)}>
        <svg viewBox="0 0 32 24" className="h-8 text-accent-ink" fill="currentColor" aria-hidden="true">
          <path d="M0 24V14C0 6 4 1.2 12 0l1.5 3.3C9 4.6 7 7.4 6.8 11H13v13H0Zm19 0V14c0-8 4-12.8 12-14l1 3.3c-4.5 1.3-6.5 4.1-6.7 7.7H32v13H19Z" />
        </svg>
        <blockquote className="text-title1 leading-tight font-semibold text-balance md:text-[2.25rem]">{t.quote}</blockquote>
        <figcaption className="flex items-center gap-3 text-start">
          <Avatar src={t.avatar} name={t.name} size="lg" />
          <span className="flex flex-col">
            <span className="text-headline">{t.name}</span>
            {t.role && <span className="text-subhead text-fg-muted">{t.role}</span>}
          </span>
        </figcaption>
      </figure>
    );
  }
  if (layout === "carousel") {
    const scroll = (dir: -1 | 1) => {
      const el = track.current;
      if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
    };
    const arrow =
      "pl-focus-ring grid size-10 cursor-pointer place-items-center rounded-full bg-surface text-fg shadow-sm transition-colors hover:bg-surface-2 [&_svg]:size-5";
    return (
      <div className={cn("flex flex-col gap-5", className)}>
        <ul
          ref={track}
          aria-label={label}
          className="pl-no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [contain:inline-size]"
        >
          {items.map((t, i) => (
            <li key={i} className="flex w-[min(22rem,82vw)] shrink-0 snap-start">
              <TestimonialCard {...t} className="w-full" />
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <button type="button" aria-label="Previous" onClick={() => scroll(-1)} className={arrow}>
            <ChevronRightIcon className="rotate-180 rtl:rotate-0" strokeWidth={2.5} />
          </button>
          <button type="button" aria-label="Next" onClick={() => scroll(1)} className={arrow}>
            <ChevronRightIcon className="rtl:rotate-180" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }
  return (
    <ul aria-label={label} className={cn("columns-1 gap-4 sm:columns-2 lg:columns-3", className)}>
      {items.map((t, i) => (
        <li key={i} className="mb-4 break-inside-avoid">
          <TestimonialCard {...t} />
        </li>
      ))}
    </ul>
  );
}
