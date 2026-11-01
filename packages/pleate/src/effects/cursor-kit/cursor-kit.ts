// Internal helpers shared by pleate's cursor and canvas effects (BlobCursor, Crosshair, GhostCursor, GlowCursor,
// CursorGrid, ElasticMesh, HalftoneReveal...). Pointer tracking stays inside a host element unless `global` is set,
// ignores touch, and never hides the system cursor.
"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { cssColorToRgb } from "../shader/shader.tsx";

/** True on a mouse or trackpad with motion allowed. */
export function useFinePointer() {
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  return fine && !reduced;
}

export type PointerHandlers = {
  move: (x: number, y: number) => void;
  leave?: () => void;
  down?: (x: number, y: number) => void;
};

/**
 * Mouse and pen events over `ref` (or the whole window when `global`), as px relative to the element
 * (or the viewport when global). Touch is ignored.
 */
export function useHostPointer(ref: RefObject<HTMLElement | null>, handlers: PointerHandlers, global = false, enabled = true) {
  const live = useRef(handlers);
  live.current = handlers;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const target: HTMLElement | Window = global ? window : el;
    const at = (e: PointerEvent): [number, number] => {
      if (global) return [e.clientX, e.clientY];
      const r = el.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const fine = (e: PointerEvent) => e.pointerType === "mouse" || e.pointerType === "pen";
    const move = (e: Event) => fine(e as PointerEvent) && live.current.move(...at(e as PointerEvent));
    const down = (e: Event) => fine(e as PointerEvent) && live.current.down?.(...at(e as PointerEvent));
    const leave = () => live.current.leave?.();
    const leaveTarget = global ? document.documentElement : el;
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerdown", down);
    leaveTarget.addEventListener("pointerleave", leave);
    return () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerdown", down);
      leaveTarget.removeEventListener("pointerleave", leave);
    };
  }, [ref, global, enabled]);
}

/** A CSS color (tokens included) as rgb 0..255, re-read when the theme or palette changes. Null before mount. */
export function useRgb(color: string, ref?: RefObject<Element | null>) {
  const [rgb, setRgb] = useState<[number, number, number] | null>(null);
  useEffect(() => {
    const read = () => setRgb(cssColorToRgb(color, ref?.current ?? document.documentElement).map((v) => Math.round(v * 255)) as [number, number, number]);
    read();
    const watch = new MutationObserver(read);
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "style", "class"] });
    return () => watch.disconnect();
  }, [color, ref]);
  return rgb;
}

/**
 * Calls `draw(ctx, width, height, dt)` every frame on a canvas sized to its CSS box (DPR aware, drawing in CSS px).
 * Pauses off screen and in hidden tabs. Return false from draw to stop until `wake()` is called.
 */
export function useCanvasLoop(
  ref: RefObject<HTMLCanvasElement | null>,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => boolean | void,
  enabled = true,
) {
  const live = useRef(draw);
  live.current = draw;
  const wakeRef = useRef(() => {});
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !enabled) return;
    let w = 0, h = 0, frame = 0, running = false, visible = true, last = performance.now();
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      wake();
    };
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      const more = live.current(ctx, w, h, dt);
      if (more === false) running = false;
      else frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (running || !visible) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    wakeRef.current = wake;
    const sizeWatch = new ResizeObserver(resize);
    sizeWatch.observe(canvas);
    const viewWatch = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      wake();
    });
    viewWatch.observe(canvas);
    document.addEventListener("visibilitychange", wake);
    return () => {
      cancelAnimationFrame(frame);
      sizeWatch.disconnect();
      viewWatch.disconnect();
      document.removeEventListener("visibilitychange", wake);
      wakeRef.current = () => {};
    };
  }, [ref, enabled]);
  return useCallback(() => wakeRef.current(), []);
}
