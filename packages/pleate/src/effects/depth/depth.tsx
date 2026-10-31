// Depth: 3D pieces without WebGL. FlipCard turns over to show its back, by click, keyboard or hover. Carousel3D
// sets slides on a ring and turns it with buttons, arrow keys or a swipe. CardStack piles cards up as you scroll,
// tipping the ones underneath back into depth. TiltWall is a tilted wall of columns drifting in opposite directions.
// DotGlobe is a canvas globe of dots with markers, turning slowly and draggable. Reduced motion keeps every state
// without the movement.
"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Children, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { cn } from "../../lib/cn.ts";
import { ChevronRightIcon } from "../../lib/icons.tsx";
import { useControllableState } from "../../lib/use-controllable-state.ts";

const TURN = "transition-transform duration-700 ease-out motion-reduce:transition-none";

/* ------------------------------------------------------------------------------------------------ FlipCard */

export type FlipCardProps = {
  front: ReactNode;
  back: ReactNode;
  flipped?: boolean;
  defaultFlipped?: boolean;
  onFlippedChange?: (flipped: boolean) => void;
  /** "click" makes the card a toggle button (keep its faces free of links and buttons); "hover" also flips on focus;
   *  "manual" only follows `flipped`, for cards whose faces hold their own controls. */
  trigger?: "click" | "hover" | "manual";
  axis?: "x" | "y";
  /** Accessible name of the toggle when trigger="click". */
  label?: string;
  className?: string;
};

export function FlipCard({
  front,
  back,
  flipped,
  defaultFlipped = false,
  onFlippedChange,
  trigger = "click",
  axis = "y",
  label = "Show the other side",
  className,
}: FlipCardProps) {
  const [isFlipped, setFlipped] = useControllableState({ value: flipped, defaultValue: defaultFlipped, onChange: onFlippedChange });
  const toggle = () => setFlipped(!isFlipped);
  const rotate = axis === "y" ? "rotateY(180deg)" : "rotateX(180deg)";
  const click = trigger === "click";
  const hover = trigger === "hover";
  return (
    <div
      className={cn("group/flip relative [perspective:1200px]", click && "pl-focus-ring pl-touch cursor-pointer rounded-xl", className)}
      {...(click && {
        role: "button",
        tabIndex: 0,
        "aria-pressed": isFlipped,
        "aria-label": label,
        onClick: toggle,
        onKeyDown: (event: KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        },
      })}
      {...(hover && {
        tabIndex: 0,
        onPointerEnter: () => setFlipped(true),
        onPointerLeave: () => setFlipped(false),
        onFocus: () => setFlipped(true),
        onBlur: () => setFlipped(false),
      })}
    >
      <div
        className={cn("grid h-full [grid-template-areas:'face'] [transform-style:preserve-3d]", TURN)}
        style={{ transform: isFlipped ? rotate : "none" }}
      >
        <div className="h-full [grid-area:face] [backface-visibility:hidden]" aria-hidden={isFlipped || undefined} inert={isFlipped || undefined}>
          {front}
        </div>
        <div
          className="h-full [grid-area:face] [backface-visibility:hidden]"
          style={{ transform: rotate }}
          aria-hidden={!isFlipped || undefined}
          inert={!isFlipped || undefined}
        >
          {back}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- Carousel3D */

export type Carousel3DProps = {
  /** Slides; 3 or more make a ring. */
  items: ReactNode[];
  /** Index of the front slide. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Slide width and height in px. */
  itemWidth?: number;
  itemHeight?: number;
  /** Space between slides on the ring, in px. */
  gap?: number;
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
  className?: string;
};

export function Carousel3D({
  items,
  index,
  defaultIndex = 0,
  onIndexChange,
  itemWidth = 220,
  itemHeight = 280,
  gap = 24,
  label = "Carousel",
  previousLabel = "Previous slide",
  nextLabel = "Next slide",
  className,
}: Carousel3DProps) {
  const count = items.length;
  const [active, setActive] = useControllableState({ value: index, defaultValue: defaultIndex, onChange: onIndexChange });
  // Unbounded turn counter so the ring always takes the short way round, even across the wrap.
  const [turn, setTurn] = useState(active);
  const current = ((active % count) + count) % count;
  if (((turn % count) + count) % count !== current) {
    // Controlled index changed from outside: move to the nearest equivalent turn.
    let delta = current - (((turn % count) + count) % count);
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    setTurn(turn + delta);
  }
  const go = (step: number) => {
    setTurn(turn + step);
    setActive((((turn + step) % count) + count) % count);
  };
  const step = 360 / Math.max(count, 1);
  const radius = count > 2 ? Math.round((itemWidth + gap) / 2 / Math.tan(Math.PI / count)) : 0;
  const drag = useRef<number | null>(null);

  if (count === 0) return null;
  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className={cn("flex flex-col items-center gap-5", className)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") (event.preventDefault(), go(-1));
        if (event.key === "ArrowRight") (event.preventDefault(), go(1));
      }}
    >
      <div
        className="relative w-full touch-pan-y overflow-hidden [perspective:1400px]"
        style={{ height: itemHeight + 48 }}
        onPointerDown={(event) => (drag.current = event.clientX)}
        onPointerUp={(event) => {
          if (drag.current === null) return;
          const dx = event.clientX - drag.current;
          drag.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => (drag.current = null)}
      >
        <div
          className={cn("absolute start-1/2 top-6 [transform-style:preserve-3d]", TURN)}
          style={{ width: itemWidth, height: itemHeight, marginInlineStart: -itemWidth / 2, transform: `translateZ(${-radius}px) rotateY(${-turn * step}deg)` }}
        >
          {items.map((item, i) => {
            const front = i === current;
            // Distance from the front, 0 to count/2, to dim the slides at the back.
            const off = Math.min(Math.abs(i - current), count - Math.abs(i - current));
            return (
              <div
                key={i}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={!front || undefined}
                inert={!front || undefined}
                className="absolute inset-0 transition-opacity duration-500 [backface-visibility:hidden]"
                style={{ transform: `rotateY(${i * step}deg) translateZ(${radius}px)`, opacity: 1 - Math.min(off * 0.22, 0.7) } as CSSProperties}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <RingButton label={previousLabel} onClick={() => go(-1)} flip />
        <span aria-live="polite" className="min-w-14 text-center font-mono text-caption1 text-fg-muted pl-tabular">
          {current + 1} / {count}
        </span>
        <RingButton label={nextLabel} onClick={() => go(1)} />
      </div>
    </section>
  );
}

function RingButton({ label, onClick, flip }: { label: string; onClick: () => void; flip?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pl-focus-ring pl-touch pl-field pl-hit relative grid size-8 cursor-pointer place-items-center rounded-md bg-surface text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      <ChevronRightIcon className={cn("size-4", flip && "rotate-180")} strokeWidth={2} />
    </button>
  );
}

/* ---------------------------------------------------------------------------------------------------- CardStack */

export type CardStackProps = {
  /** Cards, in reading order. Each sticks under the previous one as the page scrolls. */
  children: ReactNode;
  /** Distance from the top of the viewport where cards stick, in px. */
  top?: number;
  /** Extra offset per card, so the edges of the pile stay visible, in px. */
  step?: number;
  className?: string;
};

export function CardStack({ children, top = 96, step = 14, className }: CardStackProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const items = Children.toArray(children);
  return (
    <div ref={ref} className={cn("relative flex flex-col gap-6 [perspective:1600px]", className)}>
      {items.map((item, i) => (
        <StackCard key={i} index={i} count={items.length} progress={scrollYProgress} top={top + i * step} reduced={reduced}>
          {item}
        </StackCard>
      ))}
    </div>
  );
}

function StackCard({ index, count, progress, top, reduced, children }: { index: number; count: number; progress: MotionValue<number>; top: number; reduced: boolean; children: ReactNode }) {
  // Once the next card arrives this one shrinks a little and tips back; the deeper it sits, the more.
  const start = index / count;
  const depth = count - 1 - index;
  const scale = useTransform(progress, [start, 1], [1, 1 - depth * 0.05]);
  const rotateX = useTransform(progress, [start, 1], [0, depth * 4]);
  const opacity = useTransform(progress, [start, 1], [1, 1 - depth * 0.12]);
  return (
    <div className="sticky" style={{ top }}>
      <motion.div style={reduced ? undefined : { scale, rotateX, opacity, transformOrigin: "50% 0%" }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/* ----------------------------------------------------------------------------------------------------- TiltWall */

export type TiltWallProps = {
  /** Tiles, spread over the columns; each column loops them. */
  items: ReactNode[];
  columns?: number;
  /** Seconds for one loop of a column. */
  duration?: number;
  /** Height of the wall in px. */
  height?: number;
  /** Stop drifting while the pointer is over the wall. */
  pauseOnHover?: boolean;
  label?: string;
  className?: string;
};

export function TiltWall({ items, columns = 4, duration = 40, height = 480, pauseOnHover = true, label, className }: TiltWallProps) {
  const cols = Array.from({ length: columns }, (_, c) => items.filter((_, i) => i % columns === c));
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      className={cn(
        "relative overflow-hidden [perspective:1400px] [mask-image:linear-gradient(to_bottom,transparent,#000_14%,#000_86%,transparent)]",
        pauseOnHover && "[&:hover_.pl-wall-col]:[animation-play-state:paused]",
        className,
      )}
      style={{ height }}
    >
      <div
        className="absolute inset-[-30%_-10%] grid gap-4 [transform-style:preserve-3d]"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, transform: "rotateX(38deg) rotateZ(-22deg) translateZ(-60px)" }}
      >
        {cols.map((col, c) => (
          <div key={c} className="overflow-hidden">
            <div
              className="pl-wall-col flex flex-col gap-4"
              style={{ animation: `pl-marquee-y ${duration + c * 6}s linear infinite${c % 2 ? " reverse" : ""}` }}
            >
              {[...col, ...col].map((item, i) => (
                // The second copy only makes the loop seamless; readers get each tile once.
                <div key={i} aria-hidden={i >= col.length || undefined} inert={i >= col.length || undefined}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------------- DotGlobe */

export type GlobeMarker = { lat: number; lon: number; label?: string };

export type DotGlobeProps = {
  /** Diameter in px; the canvas follows the device pixel ratio. */
  size?: number;
  /** Number of dots on the sphere. */
  dots?: number;
  markers?: GlobeMarker[];
  /** Degrees per second; 0 keeps it still. */
  speed?: number;
  /** Starting longitude facing the viewer. */
  initialLon?: number;
  /** Tilt toward the viewer, in degrees. */
  tilt?: number;
  label?: string;
  className?: string;
};

const RAD = Math.PI / 180;

export function DotGlobe({ size = 360, dots = 1400, markers = [], speed = 8, initialLon = -10, tilt = 18, label = "Globe", className }: DotGlobeProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const lon = useRef(initialLon);
  const drag = useRef<{ x: number; lon: number } | null>(null);
  // Lets drag and keys repaint a still globe (reduced motion or off screen).
  const redraw = useRef(() => {});

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = size * dpr;
    el.height = size * dpr;
    // Fibonacci sphere: evenly spread points, computed once.
    const golden = Math.PI * (3 - Math.sqrt(5));
    const points = Array.from({ length: dots }, (_, i) => {
      const y = 1 - (i / (dots - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      return [Math.cos(golden * i) * r, y, Math.sin(golden * i) * r] as const;
    });
    const R = (size / 2 - 8) * dpr;
    const c = (size / 2) * dpr;
    const ct = Math.cos(tilt * RAD);
    const st = Math.sin(tilt * RAD);

    const project = (x: number, y: number, z: number, a: number) => {
      // Spin around the vertical axis, then tilt toward the viewer.
      const x1 = x * Math.cos(a) - z * Math.sin(a);
      const z1 = x * Math.sin(a) + z * Math.cos(a);
      const y2 = y * ct - z1 * st;
      const z2 = y * st + z1 * ct;
      return [c + x1 * R, c - y2 * R, z2] as const;
    };

    let frame = 0;
    let last = performance.now();
    let visible = true;
    const draw = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!reduced && !drag.current && speed) lon.current += speed * dt;
      const a = lon.current * RAD;
      // Colors are read per frame so theme and palette switches show at once.
      const css = getComputedStyle(el);
      const dotColor = css.getPropertyValue("--pl-fg-subtle").trim() || "#888";
      const markColor = css.getPropertyValue("--pl-accent-ink").trim() || "#1d4ed8";
      const lineColor = css.getPropertyValue("--pl-separator").trim() || "#ddd";
      ctx.clearRect(0, 0, el.width, el.height);
      ctx.beginPath();
      ctx.arc(c, c, R, 0, Math.PI * 2);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = dpr;
      ctx.stroke();
      ctx.fillStyle = dotColor;
      for (const [x, y, z] of points) {
        const [px, py, pz] = project(x, y, z, a);
        if (pz < 0) continue;
        ctx.globalAlpha = 0.25 + pz * 0.75;
        ctx.fillRect(px - 0.8 * dpr, py - 0.8 * dpr, 1.6 * dpr, 1.6 * dpr);
      }
      ctx.globalAlpha = 1;
      for (const m of markers) {
        const la = m.lat * RAD;
        const lo = -m.lon * RAD;
        const [px, py, pz] = project(Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo), a);
        if (pz < 0) continue;
        ctx.fillStyle = markColor;
        ctx.beginPath();
        ctx.arc(px, py, 3.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        if (m.label) {
          ctx.font = `${11 * dpr}px ${css.getPropertyValue("--pl-font-mono") || "monospace"}`;
          ctx.fillText(m.label, px + 7 * dpr, py + 4 * dpr);
        }
      }
      if (visible && !reduced) frame = requestAnimationFrame(draw);
    };
    // Only animate while on screen and while the tab is visible.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      last = performance.now();
      frame = requestAnimationFrame(draw);
    });
    io.observe(el);
    // A still globe (reduced motion) redraws when the theme or palette changes.
    redraw.current = () => reduced && requestAnimationFrame(draw);
    const mo = new MutationObserver(() => reduced && requestAnimationFrame(draw));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "style"] });
    frame = requestAnimationFrame(draw);
    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [size, dots, markers, speed, tilt, reduced]);

  const names = markers.filter((m) => m.label).map((m) => m.label);
  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={names.length ? `${label}: ${names.join(", ")}` : label}
      className={cn("pl-focus-ring touch-pan-y cursor-grab rounded-full active:cursor-grabbing", className)}
      style={{ width: size, height: size }}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, lon: lon.current };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        lon.current = drag.current.lon - (e.clientX - drag.current.x) * 0.4;
        redraw.current();
      }}
      onKeyDown={(e) => {
        // Arrow keys turn it too, for people who don't drag.
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          lon.current += e.key === "ArrowLeft" ? 15 : -15;
          redraw.current();
        }
      }}
      tabIndex={0}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    />
  );
}
