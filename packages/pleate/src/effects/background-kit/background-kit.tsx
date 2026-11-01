// Shared plumbing for pleate's animated backgrounds.
// - ShaderBackground: ShaderCanvas plus palette-aware color props (uColor0..uColor3) and a uScale uniform.
// - CanvasBackground: the same contract for canvas 2D effects (particles, lines): size and DPR, pauses off screen
//   and in hidden tabs, one still frame for reduced motion, pointer over the parent element.
// Both render one decorative canvas (aria-hidden) that fills its parent; give it `absolute inset-0` to sit behind content.
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { cssColorToRgb, SHADER_NOISE, ShaderCanvas, type UniformValue } from "../shader/shader.tsx";

export type Rgb = [number, number, number];

/** Props every background shares. */
export type BackgroundProps = {
  /** CSS colors (tokens work, e.g. "var(--pl-accent)"). Defaults follow the palette. */
  colors?: string[];
  /** Playback speed multiplier. */
  speed?: number;
  /** Pattern size multiplier: above 1 is bigger. */
  scale?: number;
  /** React to the pointer over the parent element. */
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
};

const THEME_ATTRS = ["data-theme", "data-palette", "style", "class"];

/**
 * Resolves CSS colors to rgb 0..1 and re-reads them when the theme or palette changes.
 * shortcut: reads tokens from <html>, so a theme scoped to a subtree is not seen; pass explicit colors there.
 */
export function useCssColors(colors: string[]): Rgb[] | null {
  const key = colors.join("|");
  const [rgb, setRgb] = useState<Rgb[] | null>(null);
  useEffect(() => {
    const read = () => setRgb(key.split("|").map((c) => cssColorToRgb(c)));
    read();
    const watch = new MutationObserver(read);
    watch.observe(document.documentElement, { attributes: true, attributeFilter: THEME_ATTRS });
    return () => watch.disconnect();
  }, [key]);
  return rgb;
}

/** `colors` merged over `defaults`, position by position. */
function pick(colors: string[] | undefined, defaults: string[]) {
  return defaults.map((d, i) => colors?.[i] ?? d);
}

/**
 * GLSL shared by the shader backgrounds: the ShaderBackground uniforms, SHADER_NOISE, and helpers for
 * aspect-correct coordinates (origin at the center, 1 unit = canvas height / scale), one pixel in those units,
 * and a hue ramp.
 */
export const BG_GLSL = `
uniform vec3 uColor0; uniform vec3 uColor1; uniform vec3 uColor2; uniform vec3 uColor3; uniform float uScale;
${SHADER_NOISE}
vec2 bgUv() { return (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y / uScale; }
vec2 bgPointer() { return (uPointer - 0.5) * uResolution / uResolution.y / uScale; }
float bgPx() { return 1.0 / uResolution.y / uScale; }
vec3 spectrum(float x) { return clamp(abs(mod(x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
`;

export type ShaderBackgroundProps = BackgroundProps & {
  /** Fragment body (see ShaderCanvas); start it with BG_GLSL. Gets uColor0..uColor{n-1} (vec3) and uScale (float) on top of the shared uniforms. */
  fragment: string;
  /** Default colors, one per uColorN the shader reads. */
  defaults: string[];
  uniforms?: Record<string, UniformValue>;
  maxDpr?: number;
};

export function ShaderBackground({ fragment, defaults, colors, uniforms, speed = 1, scale = 1, interactive = true, maxDpr, className, style }: ShaderBackgroundProps) {
  const rgb = useCssColors(pick(colors, defaults));
  // Wait for the colors so the first frame is not black.
  if (!rgb) return <div aria-hidden="true" className={cn("pointer-events-none size-full", className)} style={style} />;
  const all: Record<string, UniformValue> = { uScale: scale, ...uniforms };
  rgb.forEach((c, i) => (all[`uColor${i}`] = c));
  return <ShaderCanvas fragment={fragment} uniforms={all} speed={speed} interactive={interactive} maxDpr={maxDpr} className={className} style={style} />;
}

/** What a CanvasBackground draw callback gets every frame. Sizes and pointer are in CSS px. */
export type CanvasFrame = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Seconds, already multiplied by speed. */
  time: number;
  /** Seconds since the last frame, already multiplied by speed. */
  dt: number;
  /** Eased pointer position; active fades 0..1 as it enters and leaves. */
  pointer: { x: number; y: number; active: number };
  colors: Rgb[];
  scale: number;
  /** Persists across frames; reset when the size changes. Keep particles here. */
  store: Record<string, unknown>;
};

export type CanvasBackgroundProps = BackgroundProps & {
  defaults: string[];
  draw: (frame: CanvasFrame) => void;
};

/** `rgba()` string from a resolved color. */
export function rgba([r, g, b]: Rgb, a = 1) {
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
}

export function CanvasBackground({ defaults, colors, draw, speed = 1, scale = 1, interactive = true, className, style }: CanvasBackgroundProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const rgb = useCssColors(pick(colors, defaults));
  const live = useRef({ draw, speed, scale, rgb });
  live.current = { draw, speed, scale, rgb };

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let store: Record<string, unknown> = {};
    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (cw === w && ch === h) return false;
      w = cw;
      h = ch;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      store = {};
      return true;
    };

    const pointer = { x: 0, y: 0, active: 0, tx: 0, ty: 0, tActive: 0 };
    const host = canvas.parentElement ?? canvas;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.tx = e.clientX - r.left;
      pointer.ty = e.clientY - r.top;
      if (pointer.tActive === 0 && pointer.active < 0.01) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
      pointer.tActive = 1;
    };
    const onLeave = () => (pointer.tActive = 0);
    if (interactive && !reduced) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
    }

    let visible = true;
    const viewWatch = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    viewWatch.observe(canvas);

    let frame = 0, time = reduced ? 4 : 0, last = performance.now();
    const render = (dt: number) => {
      const { draw, speed, scale, rgb } = live.current;
      if (!rgb) return false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      draw({ ctx, width: w, height: h, time, dt: dt * speed, pointer, colors: rgb, scale, store });
      return true;
    };
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      frame = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      resize();
      time += dt * live.current.speed;
      const ease = 1 - Math.exp(-dt * 8);
      pointer.x += (pointer.tx - pointer.x) * ease;
      pointer.y += (pointer.ty - pointer.y) * ease;
      pointer.active += (pointer.tActive - pointer.active) * ease;
      render(dt);
    };

    // Reduced motion: a still frame, redrawn only when the size or colors change.
    let sizeWatch: ResizeObserver | undefined;
    if (reduced) {
      const still = () => {
        resize();
        if (w && h) render(0);
      };
      sizeWatch = new ResizeObserver(still);
      sizeWatch.observe(canvas);
      still();
    } else frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      viewWatch.disconnect();
      sizeWatch?.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
    // rgb is in the deps so the reduced-motion still frame repaints on a theme change.
  }, [interactive, reduced, rgb]);

  return <canvas ref={ref} aria-hidden="true" className={cn("pointer-events-none block size-full", className)} style={style} />;
}
