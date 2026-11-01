// CircularGallery: a horizontal strip of image cards bent along an arc: cards sink and turn the farther they are
// from the middle, as if laid on the rim of a wheel. It is a native scroller, so wheel, touch, a mouse drag, the
// scrollbar keys and Tab all move it; each card opens its full image in a dialog. The arc follows the scroll position
// directly, so it adds no animation of its own.
"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { cn } from "../../lib/cn.ts";

export type CircularGalleryProps = {
  images: { src: string; alt: string; title?: string; full?: string }[];
  /** Card size in px. */
  cardWidth?: number;
  cardHeight?: number;
  /** How far the outer cards sink, px; negative bends the other way. */
  bend?: number;
  /** Rotation of a card one half-width from the middle, degrees. */
  turn?: number;
  /** Accessible name of the gallery. */
  label?: string;
  className?: string;
};

export function CircularGallery({ images, cardWidth = 220, cardHeight = 280, bend = 90, turn = 14, label = "Gallery", className }: CircularGalleryProps) {
  const scroller = useRef<HTMLUListElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(-1);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let frame = 0;
    const layout = () => {
      frame = 0;
      const half = el.clientWidth / 2;
      const center = el.scrollLeft + half;
      for (const card of el.children as HTMLCollectionOf<HTMLElement>) {
        const d = Math.max(-1.6, Math.min(1.6, (card.offsetLeft + card.offsetWidth / 2 - center) / half));
        const inner = card.firstElementChild as HTMLElement | null;
        if (inner) inner.style.transform = `translateY(${d * d * bend}px) rotate(${d * turn}deg)`;
      }
    };
    const schedule = () => (frame ||= requestAnimationFrame(layout));
    layout();
    el.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [bend, turn, images.length]);

  // Mouse drag to scroll (touch and pens scroll natively).
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !scroller.current) return;
    drag.current = { x: event.clientX, left: scroller.current.scrollLeft, moved: false };
  };
  const onPointerMove = (event: PointerEvent) => {
    const d = drag.current;
    if (!d || !scroller.current) return;
    if (Math.abs(event.clientX - d.x) > 4) d.moved = true;
    if (d.moved) scroller.current.scrollLeft = d.left - (event.clientX - d.x);
  };

  const show = (i: number) => {
    setOpen(i);
    dialog.current?.showModal();
  };
  const image = images[open];

  return (
    <div className={cn("relative w-full", className)}>
      <ul
        ref={scroller}
        aria-label={label}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => setTimeout(() => (drag.current = null))}
        onPointerLeave={() => (drag.current = null)}
        className={cn("pl-focus-ring pl-no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto rounded-xl")}
        style={{ paddingInline: `calc(50% - ${cardWidth / 2}px)`, paddingBlock: `24px ${Math.abs(bend) * 1.6 + 24}px` }}
      >
        {images.map((img, i) => (
          <li key={img.src + i} className="shrink-0 snap-center" style={{ width: cardWidth }}>
            <button
              type="button"
              onClick={() => !drag.current?.moved && show(i)}
              aria-label={`Open ${img.title ?? img.alt}`}
              className="pl-focus-ring block w-full cursor-pointer overflow-hidden rounded-2xl bg-fill-3 shadow-[0_12px_32px_rgb(0_0_0/0.22)] will-change-transform"
              style={{ height: cardHeight, transformOrigin: "50% 50%" }}
            >
              <img src={img.src} alt="" draggable={false} loading="lazy" className="size-full object-cover" />
            </button>
            {img.title && <p className="mt-3 truncate text-center text-subhead text-fg-muted" aria-hidden="true">{img.title}</p>}
          </li>
        ))}
      </ul>
      <dialog
        ref={dialog}
        onClose={() => setOpen(-1)}
        onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
        className="m-auto max-h-[90vh] max-w-[min(90vw,64rem)] overflow-hidden rounded-2xl bg-surface p-0 text-fg backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        {image && (
          <figure className="flex flex-col">
            <img src={image.full ?? image.src} alt={image.alt} className="max-h-[78vh] w-full object-contain" />
            <figcaption className="flex items-center justify-between gap-4 px-5 py-3">
              <span className="text-headline">{image.title ?? image.alt}</span>
              <button type="button" onClick={() => dialog.current?.close()} className="pl-focus-ring h-9 cursor-pointer rounded-full bg-fill-3 px-4 text-subhead">
                Close
              </button>
            </figcaption>
          </figure>
        )}
      </dialog>
    </div>
  );
}
