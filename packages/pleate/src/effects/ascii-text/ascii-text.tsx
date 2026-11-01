// AsciiText: the text drawn as a grid of ASCII characters, with a slow wave running through it. The letters are
// painted on a small offscreen canvas, each pixel becomes one character picked by brightness, and the rows are
// offset by a sine so the word ripples. Screen readers get the plain text; reduced motion gets a still frame.
"use client";

import { useEffect, useRef, type ElementType } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type AsciiTextProps = {
  text: string;
  as?: ElementType;
  /** Characters from empty to full. */
  ramp?: string;
  /** Size of one character cell (px). */
  cell?: number;
  /** Wave height in cells; 0 for none. */
  amplitude?: number;
  /** Wave speed multiplier. */
  speed?: number;
  /** Character color (CSS). */
  color?: string;
  /** Font used to draw the letters before they become characters. */
  font?: string;
  className?: string;
};

export function AsciiText({
  text,
  as: Tag = "div",
  ramp = " .:-=+*#%@",
  cell = 9,
  amplitude = 1.5,
  speed = 1,
  color = "var(--pl-accent)",
  font = "800 100px system-ui, sans-serif",
  className,
}: AsciiTextProps) {
  const ref = useRef<HTMLElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const host = ref.current;
    const out = pre.current;
    if (!host || !out) return;
    const src = document.createElement("canvas");
    const ctx = src.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    let cols = 0;
    let rows = 0;
    let data: Uint8ClampedArray | null = null;
    // A monospace cell is ~0.6 as wide as it is tall: draw the source squashed so the result keeps its proportions.
    const cw = cell * 0.6;

    const layout = () => {
      cols = Math.max(8, Math.floor(host.clientWidth / cw));
      ctx.font = font;
      const measured = ctx.measureText(text).width || 1;
      const px = (100 * cols * 0.92) / measured;
      rows = Math.max(4, Math.ceil(px * 0.6 * 1.25) + Math.ceil(amplitude) * 2);
      src.width = cols;
      src.height = rows;
      ctx.clearRect(0, 0, cols, rows);
      ctx.save();
      ctx.translate(cols / 2, rows / 2);
      ctx.scale(px / 100, (px / 100) * 0.6);
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(text, 0, 0);
      ctx.restore();
      data = ctx.getImageData(0, 0, cols, rows).data;
    };

    const draw = (t: number) => {
      if (!data) return;
      let s = "";
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const sx = Math.round(x + Math.sin(y * 0.35 + t * 2) * amplitude);
          const sy = Math.round(y + Math.sin(x * 0.12 + t * 1.4) * amplitude * 0.5);
          const a = sx < 0 || sx >= cols || sy < 0 || sy >= rows ? 0 : data[(sy * cols + sx) * 4 + 3];
          s += ramp[Math.min(ramp.length - 1, Math.floor((a / 256) * ramp.length))];
        }
        s += "\n";
      }
      out.textContent = s;
    };

    let raf = 0;
    let visible = true;
    const start = performance.now();
    const loop = () => {
      draw(((performance.now() - start) / 1000) * speed);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const resize = new ResizeObserver(() => {
      layout();
      draw(0);
    });
    resize.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !reduced;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(host);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      io.disconnect();
    };
  }, [text, ramp, cell, amplitude, speed, font, reduced]);

  return (
    <Tag ref={ref} className={cn("block w-full overflow-hidden", className)}>
      <span className="sr-only">{text}</span>
      <pre
        ref={pre}
        aria-hidden="true"
        className="m-0 font-mono select-none"
        style={{ fontSize: cell, lineHeight: `${cell}px`, letterSpacing: 0, color }}
      />
    </Tag>
  );
}
