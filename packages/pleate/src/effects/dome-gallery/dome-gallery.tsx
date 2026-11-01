// DomeGallery: photos tiled on the inside of a sphere, seen from its center. Drag to look around (with a bit of
// momentum); the tilt is limited so the dome never flips. Each tile is a button: focusing it with Tab turns the
// dome to face it, and clicking or Enter opens the photo in a dialog. Arrow keys look around too. Reduced motion
// turns without easing.
"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useRef, useState, type KeyboardEvent, type CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type DomeGalleryProps = {
  images: { src: string; alt: string }[];
  /** Tiles around the dome. */
  columns?: number;
  /** Rows of tiles, centered on the horizon. */
  rows?: number;
  /** Sphere radius, px. */
  radius?: number;
  /** Height of the viewport, px. */
  height?: number;
  /** Accessible name of the gallery. */
  label?: string;
  className?: string;
};

export function DomeGallery({ images, columns = 12, rows = 3, radius = 520, height = 480, label = "Gallery", className }: DomeGalleryProps) {
  const reduced = useReducedMotion();
  const yaw = useMotionValue(0);
  const pitch = useMotionValue(0);
  const transform = useTransform([pitch, yaw], ([p, y]) => `translateZ(${radius * 0.9}px) rotateX(${p}deg) rotateY(${y}deg)`);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number; vx: number; lx: number; t: number; moved: boolean } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<{ src: string; alt: string } | null>(null);

  const lonStep = 360 / columns;
  const latStep = 22;
  const tileW = Math.round(2 * Math.PI * radius / columns - 10);
  const tileH = Math.round((latStep / 180) * Math.PI * radius - 10);
  const maxPitch = latStep * (rows / 2);
  const ease = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 120, damping: 22 };
  const clampPitch = (p: number) => Math.max(-maxPitch, Math.min(maxPitch, p));

  const tiles = Array.from({ length: columns * rows }, (_, k) => {
    const col = k % columns;
    const row = Math.floor(k / columns);
    return { lon: col * lonStep, lat: (row - (rows - 1) / 2) * latStep, image: images[k % images.length]! };
  });

  const face = (lon: number, lat: number) => {
    // Shortest yaw turn to bring this longitude to the front.
    const current = yaw.get();
    let delta = (-lon - current) % 360;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    animate(yaw, current + delta, ease);
    animate(pitch, clampPitch(-lat), ease);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const turn = { ArrowLeft: [lonStep, 0], ArrowRight: [-lonStep, 0], ArrowUp: [0, -latStep], ArrowDown: [0, latStep] }[event.key];
    if (!turn || (event.target as HTMLElement).tagName === "BUTTON") return;
    event.preventDefault();
    animate(yaw, yaw.get() + turn[0]!, ease);
    animate(pitch, clampPitch(pitch.get() + turn[1]!), ease);
  };

  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn("pl-focus-ring relative w-full cursor-grab touch-none overflow-hidden rounded-2xl bg-bg select-none active:cursor-grabbing [perspective:var(--dg-p)]", className)}
      style={{ height, "--dg-p": `${radius * 0.9}px` } as CSSProperties}
      onPointerDown={(event) => {
        yaw.stop();
        pitch.stop();
        drag.current = { x: event.clientX, y: event.clientY, yaw: yaw.get(), pitch: pitch.get(), vx: 0, lx: event.clientX, t: performance.now(), moved: false };
      }}
      onPointerMove={(event) => {
        const d = drag.current;
        if (!d) return;
        const now = performance.now();
        d.vx = (event.clientX - d.lx) / Math.max(1, now - d.t);
        d.lx = event.clientX;
        d.t = now;
        if (!d.moved && Math.hypot(event.clientX - d.x, event.clientY - d.y) > 4) {
          d.moved = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        if (!d.moved) return;
        yaw.set(d.yaw + (event.clientX - d.x) * 0.15);
        pitch.set(clampPitch(d.pitch - (event.clientY - d.y) * 0.15));
      }}
      onPointerUp={() => {
        const d = drag.current;
        drag.current = null;
        if (d?.moved && !reduced) animate(yaw, yaw.get() + d.vx * 160, { type: "spring", stiffness: 60, damping: 20 });
      }}
      onPointerCancel={() => (drag.current = null)}
    >
      <motion.div className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]" style={{ transform }}>
        {tiles.map(({ lon, lat, image }, k) => (
          <button
            key={k}
            type="button"
            aria-label={`Open ${image.alt}`}
            onFocus={() => face(lon, lat)}
            onClick={() => {
              setOpen(image);
              dialog.current?.showModal();
            }}
            className="pl-focus-ring absolute cursor-pointer overflow-hidden rounded-xl bg-fill-3 [backface-visibility:hidden]"
            style={{
              width: tileW,
              height: tileH,
              left: -tileW / 2,
              top: -tileH / 2,
              transform: `rotateY(${lon}deg) rotateX(${-lat}deg) translateZ(${-radius}px)`,
            }}
          >
            <img src={image.src} alt="" draggable={false} loading="lazy" className="size-full object-cover" />
          </button>
        ))}
      </motion.div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,var(--pl-bg)_95%)]" />
      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
        className="m-auto max-h-[90vh] max-w-[min(90vw,56rem)] overflow-hidden rounded-2xl bg-surface p-0 backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        {open && <img src={open.src} alt={open.alt} className="max-h-[85vh] w-full object-contain" />}
        <form method="dialog" className="absolute top-3 right-3">
          <button className="pl-focus-ring h-9 cursor-pointer rounded-full bg-black/60 px-4 text-subhead text-white backdrop-blur">Close</button>
        </form>
      </dialog>
    </div>
  );
}
