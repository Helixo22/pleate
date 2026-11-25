// The parts of pixel art that follow the scroll or a clock.
// - PixelCanvas: a tiny canvas (96 pixels by default) redrawn from code and scaled up with hard edges. Inside a
//   ScrollScene it follows the scroll, and with animate it also gets a clock for steam, bubbles and the like.
// - PixelSteps: which step of a scene is showing, as a row of squares. Pressing one can jump there.
"use client";

import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { useSceneProgress } from "../scroll-scene/scroll-scene.tsx";
import { PixelBuffer } from "./buffer.ts";

/* ------------------------------------------------------------------------------------------------ PixelCanvas */

export type PixelFrameState = {
  /** Scroll progress of the scene, 0..1. */
  progress: number;
  /** Seconds of the clock, 0 unless animate is on. It stands still with reduced motion. */
  time: number;
};

export type PixelCanvasProps = {
  /** Draws one frame. The buffer comes cleared. */
  draw: (p: PixelBuffer, state: PixelFrameState) => void;
  /** Pixels on each side of the drawing. */
  size?: number;
  /** Defaults to the enclosing ScrollScene's progress. */
  progress?: MotionValue<number>;
  /** Run the clock, at this many frames per second. */
  animate?: boolean;
  fps?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
};

export function PixelCanvas({ draw, size = 96, progress: progressProp, animate = false, fps = 12, label, className, style }: PixelCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const sceneProgress = useSceneProgress();
  const progress = progressProp ?? sceneProgress;
  const reduced = useReducedMotion();
  const live = useRef({ draw, progress });
  live.current = { draw, progress };

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const buffer = new PixelBuffer(size);
    const image = context.createImageData(size, size);
    const words = new Uint32Array(image.data.buffer);
    const colors = new Map<string, number>();
    const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    // Any CSS color, theme variables included, to the four bytes of a canvas pixel.
    const word = (color: string) => {
      const known = colors.get(color);
      if (known !== undefined) return known;
      canvas.style.color = color;
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = getComputedStyle(canvas).color;
      canvas.style.color = "";
      probe.fillRect(0, 0, 1, 1);
      const value = new Uint32Array(probe.getImageData(0, 0, 1, 1).data.buffer)[0];
      colors.set(color, value);
      return value;
    };

    let frame = 0;
    let visible = false;
    let time = 0;
    let last = 0;
    let painted = -1;
    const running = animate && !reduced;
    const paint = () => {
      buffer.clear();
      live.current.draw(buffer, { progress: live.current.progress.get(), time });
      const inks = buffer.palette.map(word);
      for (let i = 0; i < words.length; i++) words[i] = buffer.data[i] ? inks[buffer.data[i] - 1] : 0;
      context.putImageData(image, 0, 0);
    };
    const schedule = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const tick = (now: number) => {
      frame = 0;
      if (running) {
        time += last ? Math.min((now - last) / 1000, 0.1) : 0;
        last = now;
        const step = Math.floor(time * fps);
        if (step !== painted) paint();
        painted = step;
        schedule();
      } else paint();
    };
    const stopProgress = live.current.progress.on("change", () => {
      painted = -1;
      schedule();
    });
    const view = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      last = 0;
      schedule();
    });
    view.observe(canvas);
    const theme = new MutationObserver(() => {
      colors.clear();
      painted = -1;
      schedule();
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "style", "class"] });
    const onVisibility = () => {
      last = 0;
      schedule();
    };
    document.addEventListener("visibilitychange", onVisibility);
    paint();
    return () => {
      cancelAnimationFrame(frame);
      stopProgress();
      view.disconnect();
      theme.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [size, animate, fps, reduced, progress]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("block aspect-square size-full object-contain [image-rendering:pixelated]", className)}
      style={style}
    />
  );
}

/* ------------------------------------------------------------------------------------------------ PixelSteps */

export type PixelStepsProps = {
  /** How many steps, or their names (read by screen readers). */
  steps: number | readonly string[];
  /** Controlled step. Without it the enclosing ScrollScene's progress decides. */
  current?: number;
  onSelect?: (step: number) => void;
  label?: string;
  className?: string;
};

export function PixelSteps({ steps, current, onSelect, label = "Steps", className }: PixelStepsProps) {
  const names = typeof steps === "number" ? Array.from({ length: steps }, (_, i) => `Step ${i + 1}`) : steps;
  const progress = useSceneProgress();
  const [scrolled, setScrolled] = useState(0);
  useMotionValueEvent(progress, "change", (t) => setScrolled(Math.min(names.length - 1, Math.floor(t * names.length))));
  const at = current ?? scrolled;
  return (
    <ol aria-label={label} className={cn("flex items-center", className)}>
      {names.map((name, i) => {
        const square = (
          <span
            aria-hidden
            className={cn("block size-3 border-2 border-fg transition-colors duration-150 motion-reduce:transition-none", i <= at ? "bg-accent" : "bg-transparent")}
          />
        );
        return (
          <li key={name} aria-current={i === at ? "step" : undefined}>
            {onSelect ? (
              <button type="button" aria-label={name} onClick={() => onSelect(i)} className="pl-focus-ring grid size-7 cursor-pointer place-items-center">
                {square}
              </button>
            ) : (
              <span className="grid size-5 place-items-center">
                {square}
                <span className="sr-only">{name}</span>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
