// ThreeScene: a three.js canvas that fills its parent, with one renderer and one render loop.
// - setup(ctx) runs once per mount and builds the scene. It can be async (load a model first) and returns the hooks
//   the loop calls: frame(state) before each render, theme() when the palette changes, dispose() on unmount.
// - The progress comes from the enclosing ScrollScene (or the `progress` prop), so the picture is a function of the
//   scroll and scrolling back plays it backwards.
// - loop "demand" (the default) draws only when something changed: the progress, the size, the theme, or a call to
//   ctx.invalidate(). loop "always" also runs a clock for ambient motion; reduced motion stops that clock.
// - Nothing draws while the canvas is off screen or the tab is hidden. The resolution steps down by itself when frames
//   run slow. Geometries, materials and textures in the scene are disposed on unmount, and the WebGL context is
//   released, so remounts (StrictMode, route changes) do not pile up contexts.
// - Without WebGL2 it renders `fallback` instead.
// - three is an optional peer dependency: install it in the app (`npm install three`) to use this module.
"use client";

import type { MotionValue } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  Color,
  Mesh,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
  type Material,
  type Object3D,
} from "three";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { useSceneProgress } from "../scroll-scene/scroll-scene.tsx";
import { cssColorToRgb } from "../shader/shader.tsx";

export type ThreePalette = { accent: Color; fg: Color; bg: Color; surface: Color };

export type ThreeContext = {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  canvas: HTMLCanvasElement;
  /** The theme's colors, kept current. Read them in theme() to recolor materials. */
  palette: ThreePalette;
  /** True on screens narrower than Tailwind's md breakpoint, read at mount: use it to build lighter geometry. */
  phone: boolean;
  reduced: boolean;
  /** Asks for one more frame. */
  invalidate: () => void;
};

export type FrameState = {
  /** Scroll progress, 0..1. */
  progress: number;
  /** Seconds of the ambient clock (loop "always" only; stands still with reduced motion). */
  time: number;
  /** Seconds since the last frame, capped at 0.1. */
  delta: number;
};

export type ThreeSceneHooks = {
  frame?: (state: FrameState) => void;
  theme?: () => void;
  dispose?: () => void;
};

export type ThreeSceneProps = {
  /** Builds the scene. Runs once per mount: change the component's key to rebuild it. */
  setup: (ctx: ThreeContext) => ThreeSceneHooks | void | Promise<ThreeSceneHooks | void>;
  /** Defaults to the enclosing ScrollScene's progress. */
  progress?: MotionValue<number>;
  loop?: "demand" | "always";
  fov?: number;
  near?: number;
  far?: number;
  /** Cap on the device pixel ratio on tablets and desktops. */
  maxDpr?: number;
  /** Cap on phones. */
  phoneMaxDpr?: number;
  /** Lower the resolution (down to 1x) when frames take longer than about 22 ms. */
  adaptive?: boolean;
  shadows?: boolean;
  /** Transparent canvas, so the page shows through where nothing is drawn. */
  transparent?: boolean;
  /** Shown instead of the canvas when WebGL2 is not available. */
  fallback?: ReactNode;
  /** Describes the picture to screen readers. Without it the canvas is decorative. */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

const PHONE = "(max-width: 47.99rem)";

function readPalette(el: Element, into: ThreePalette) {
  const set = (c: Color, token: string) => {
    const [r, g, b] = cssColorToRgb(`var(${token})`, el);
    c.setRGB(r, g, b, SRGBColorSpace);
  };
  set(into.accent, "--pl-accent");
  set(into.fg, "--pl-fg");
  set(into.bg, "--pl-bg");
  set(into.surface, "--pl-surface");
}

/** Frees the GPU memory of everything under `root`: geometries, materials and the textures they use. */
export function disposeObject(root: Object3D) {
  root.traverse((node) => {
    const mesh = node as Mesh;
    mesh.geometry?.dispose();
    const materials = (Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []) as Material[];
    for (const m of materials) {
      for (const value of Object.values(m)) if (value instanceof Texture) value.dispose();
      m.dispose();
    }
  });
}

export function ThreeScene({
  setup,
  progress: progressProp,
  loop = "demand",
  fov = 35,
  near = 0.05,
  far = 100,
  maxDpr = 1.75,
  phoneMaxDpr = 1.25,
  adaptive = true,
  shadows = false,
  transparent = true,
  fallback = null,
  label,
  className,
  style,
}: ThreeSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const sceneProgress = useSceneProgress();
  const progress = progressProp ?? sceneProgress;
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  // Read through refs so a re-render never rebuilds the scene.
  const live = useRef({ setup, progress, reduced, loop });
  live.current = { setup, progress, reduced, loop };
  const invalidateRef = useRef<() => void>(() => {});

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    // A fresh canvas per mount: a canvas whose context was released cannot give a new one, and StrictMode or a
    // remount would otherwise reuse it.
    const canvas = document.createElement("canvas");
    canvas.className = "block size-full";
    host.appendChild(canvas);
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, antialias: true, alpha: transparent, powerPreference: "high-performance" });
    } catch {
      canvas.remove();
      setFailed(true);
      return;
    }
    const phone = window.matchMedia(PHONE).matches;
    let dpr = Math.min(window.devicePixelRatio || 1, phone ? phoneMaxDpr : maxDpr);
    renderer.setPixelRatio(dpr);
    renderer.shadowMap.enabled = shadows;
    renderer.shadowMap.type = PCFShadowMap;
    if (transparent) renderer.setClearColor(0x000000, 0);

    const scene = new Scene();
    const camera = new PerspectiveCamera(fov, 1, near, far);
    const palette: ThreePalette = { accent: new Color(), fg: new Color(), bg: new Color(), surface: new Color() };
    readPalette(canvas, palette);

    let frame = 0;
    let visible = false;
    let cancelled = false;
    let hooks: ThreeSceneHooks = {};
    let time = 0;
    let last = 0;
    // Adaptive resolution: a running average of the gap between back-to-back frames.
    let slow = 0;
    let avg = 1 / 60;

    const running = () => live.current.loop === "always" && !live.current.reduced;
    const schedule = () => {
      if (!frame && visible && !document.hidden && !cancelled) frame = requestAnimationFrame(tick);
    };
    const invalidate = () => schedule();
    invalidateRef.current = invalidate;

    const tick = (now: number) => {
      frame = 0;
      const gap = last ? (now - last) / 1000 : 0;
      const delta = Math.min(gap, 0.1);
      last = now;
      if (running()) time += delta;
      hooks.frame?.({ progress: live.current.progress.get(), time, delta });
      renderer.render(scene, camera);
      // Only back-to-back frames say anything about speed (a frame after a pause has a long gap by design).
      if (adaptive && gap > 0 && gap < 0.1 && dpr > 1) {
        avg += (gap - avg) * 0.1;
        slow = avg > 0.022 ? slow + 1 : 0;
        if (slow > 45) {
          dpr = Math.max(1, dpr - 0.25);
          renderer.setPixelRatio(dpr);
          renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
          slow = 0;
          avg = 1 / 60;
        }
      }
      // `last` survives between demand frames: while scrolling they come back to back and count for the speed check;
      // after a pause the gap is long and the check skips it.
      if (running()) schedule();
    };

    const resize = () => {
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      invalidate();
    };
    const sizeWatch = new ResizeObserver(resize);
    sizeWatch.observe(canvas);
    resize();

    const viewWatch = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
    viewWatch.observe(canvas);
    const onVisibility = () => {
      last = 0;
      schedule();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const themeWatch = new MutationObserver(() => {
      readPalette(canvas, palette);
      hooks.theme?.();
      invalidate();
    });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "style", "class"] });

    const onLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", invalidate);

    const ctx: ThreeContext = { renderer, scene, camera, canvas, palette, phone, reduced: live.current.reduced, invalidate };
    Promise.resolve()
      .then(() => live.current.setup(ctx))
      .then(
        (result) => {
          if (cancelled) {
            result?.dispose?.();
            return;
          }
          hooks = result ?? {};
          invalidate();
        },
        (error: unknown) => console.error("pleate ThreeScene: setup failed", error),
      );

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      sizeWatch.disconnect();
      viewWatch.disconnect();
      themeWatch.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", invalidate);
      hooks.dispose?.();
      disposeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      invalidateRef.current = () => {};
    };
    // The renderer is built once per mount; these props only take effect on a remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every change of the progress asks for a frame; so does a new progress source or a change of loop or motion.
  useEffect(() => {
    invalidateRef.current();
    return progress.on("change", () => invalidateRef.current());
  }, [progress, loop, reduced]);

  if (failed) return <>{fallback}</>;
  return (
    <div
      ref={ref}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("size-full", className)}
      style={style}
    />
  );
}
