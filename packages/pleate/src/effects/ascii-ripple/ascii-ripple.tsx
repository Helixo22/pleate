// AsciiRipple: a full-size field of monospace characters that behaves like water. The pointer (over the parent
// element) and taps drop ripples into a height field; each cell picks a denser glyph and a brighter palette color as
// the wave passes. With no pointer around, a soft drop falls every few seconds so the field never sits dead.
// Canvas 2D, decorative (aria-hidden), paused off screen and in hidden tabs, one still frame for reduced motion.
// Put it in a positioned parent with a background; the canvas fills it and ignores pointer events itself.
"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { cssColorToRgb } from "../shader/shader.tsx";

export type AsciiRippleProps = {
  /** Glyphs from light to dense. The first one is drawn for calm water (a space keeps it empty). */
  charset?: string;
  /** Font size of one cell in px. Smaller means more cells and more work per frame. */
  cellSize?: number;
  /** Color of the wave crests. Any CSS color, tokens included. */
  color?: string;
  /** Color of the calm field. */
  baseColor?: string;
  /** Opacity of the calm field, 0..1. */
  baseOpacity?: number;
  /** How long ripples last, 0.9..0.995. Higher rings longer. */
  damping?: number;
  /** Drop ripples automatically when no pointer is around. */
  idle?: boolean;
  /** Follow the pointer and taps over the parent element. */
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
};

const LEVELS = 8;

export function AsciiRipple({
  charset = " .:-=+*#%@",
  cellSize = 14,
  color = "var(--pl-accent)",
  baseColor = "var(--pl-fg)",
  baseOpacity = 0.16,
  damping = 0.965,
  idle = true,
  interactive = true,
  className,
  style,
}: AsciiRippleProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const glyphs = [...charset];
    // The canvas carries font-mono, so the glyphs use the theme's mono family.
    const font = `${cellSize}px ${getComputedStyle(canvas).fontFamily || "monospace"}`;

    let crest = "rgb(0 0 0)";
    let base = "rgb(0 0 0)";
    const readColors = () => {
      const rgb = (c: string) => `rgb(${cssColorToRgb(c, canvas).map((v) => Math.round(v * 255)).join(" ")}`;
      crest = rgb(color);
      base = rgb(baseColor);
    };
    readColors();
    const themeWatch = new MutationObserver(readColors);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "style", "class"] });

    // Height field: two buffers, classic discrete wave equation.
    let cols = 0, rows = 0, cw = 0, ch = 0, dpr = 1;
    let cur = new Float32Array(0), prev = new Float32Array(0);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.font = font;
      cw = Math.max(4, ctx.measureText("M").width);
      ch = cellSize * 1.2;
      cols = Math.ceil(w / cw) + 1;
      rows = Math.ceil(h / ch) + 1;
      cur = new Float32Array(cols * rows);
      prev = new Float32Array(cols * rows);
    };
    resize();
    const sizeWatch = new ResizeObserver(() => {
      resize();
      if (reduced) still();
    });
    sizeWatch.observe(canvas);

    const drop = (x: number, y: number, strength: number, radius = 2) => {
      const cx = Math.round(x / cw), cy = Math.round(y / ch);
      for (let dy = -radius; dy <= radius; dy++)
        for (let dx = -radius; dx <= radius; dx++) {
          const gx = cx + dx, gy = cy + dy;
          if (gx < 1 || gy < 1 || gx >= cols - 1 || gy >= rows - 1) continue;
          const d = Math.hypot(dx, dy) / (radius + 1);
          if (d < 1) cur[gy * cols + gx] += strength * (1 - d);
        }
    };

    const step = () => {
      for (let y = 1; y < rows - 1; y++)
        for (let x = 1; x < cols - 1; x++) {
          const i = y * cols + x;
          prev[i] = ((cur[i - 1] + cur[i + 1] + cur[i - cols] + cur[i + cols]) * 0.5 - prev[i]) * damping;
        }
      [cur, prev] = [prev, cur];
    };

    // Characters grouped by brightness so fillStyle and globalAlpha change only a few times per frame.
    const buckets: { x: number; y: number; g: string }[][] = Array.from({ length: LEVELS * 2 }, () => []);
    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = font;
      ctx.textBaseline = "top";
      for (const b of buckets) b.length = 0;
      const top = glyphs.length - 1;
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const h = Math.min(1, Math.abs(cur[y * cols + x]));
          // Calm water: a slow interference pattern so the field reads as a surface.
          const calm = 0.5 + 0.25 * (Math.sin(x * 0.21 + t * 0.6) + Math.sin(y * 0.33 - t * 0.45 + x * 0.05));
          const level = Math.min(1, calm * 0.28 + h * 1.4);
          const g = glyphs[Math.round(level * top)];
          if (g === " ") continue;
          const wave = h > 0.04;
          const k = Math.min(LEVELS - 1, Math.floor((wave ? h * 1.6 : calm) * LEVELS));
          buckets[(wave ? LEVELS : 0) + k].push({ x: x * cw, y: y * ch, g });
        }
      buckets.forEach((b, i) => {
        if (!b.length) return;
        const wave = i >= LEVELS;
        const k = (i % LEVELS) / (LEVELS - 1);
        ctx.fillStyle = wave ? crest : base;
        ctx.globalAlpha = wave ? 0.35 + 0.65 * k : baseOpacity * (0.5 + 0.5 * k);
        for (const c of b) ctx.fillText(c.g, c.x, c.y);
      });
      ctx.globalAlpha = 1;
    };

    // Reduced motion: a few ripples run forward off screen, then one frame.
    function still() {
      drop(canvas!.clientWidth * 0.3, canvas!.clientHeight * 0.45, 2.4, 3);
      drop(canvas!.clientWidth * 0.72, canvas!.clientHeight * 0.6, 1.8, 3);
      for (let i = 0; i < 26; i++) step();
      draw(2);
    }
    if (reduced) {
      still();
      return () => {
        themeWatch.disconnect();
        sizeWatch.disconnect();
      };
    }

    let lastPointer = -1e9;
    let lastCell = -1;
    const host = canvas.parentElement ?? canvas;
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const [x, y] = local(e);
      lastPointer = performance.now();
      const cell = Math.round(y / ch) * cols + Math.round(x / cw);
      if (cell !== lastCell) drop(x, y, 0.55, 1);
      lastCell = cell;
    };
    const onDown = (e: PointerEvent) => {
      const [x, y] = local(e);
      lastPointer = performance.now();
      drop(x, y, 3, 3);
    };
    if (interactive) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerdown", onDown);
    }

    let visible = true;
    const viewWatch = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    viewWatch.observe(canvas);

    let frame = 0, time = 0, last = performance.now(), nextIdle = 600, acc = 0;
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!visible || document.hidden) return;
      time += dt;
      if (idle && now - lastPointer > 2500 && (nextIdle -= dt * 1000) <= 0) {
        drop(Math.random() * canvas.clientWidth, Math.random() * canvas.clientHeight, 2.2, 3);
        nextIdle = 1800 + Math.random() * 1600;
      }
      // Fixed 60 Hz simulation so ripple speed does not depend on the display refresh rate.
      acc += dt;
      while (acc >= 1 / 60) {
        step();
        acc -= 1 / 60;
      }
      draw(time);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      themeWatch.disconnect();
      sizeWatch.disconnect();
      viewWatch.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
    };
  }, [charset, cellSize, color, baseColor, baseOpacity, damping, idle, interactive, reduced]);

  return <canvas ref={ref} aria-hidden="true" className={cn("pointer-events-none block size-full font-mono", className)} style={style} />;
}
