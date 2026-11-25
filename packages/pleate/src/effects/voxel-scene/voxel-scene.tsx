// Voxel scenes, drawn as large pixels with a dark contour.
// - VoxelScene: a ThreeScene whose setup gets add() for voxel models, burst() for flying cubes and shadow() for the
//   ground. Like ThreeScene it follows the ScrollScene around it and draws only when something changed.
// - VoxelView: one model that turns by itself, by drag or with the arrow keys, and can come apart.
// three is an optional peer dependency: install it in the app (`npm install three`) to use this module.
"use client";

import { useMotionValue, type MotionValue } from "motion/react";
import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { Box3, Scene, Sphere } from "three";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { cssColorToRgb } from "../shader/shader.tsx";
import { disposeObject, ThreeScene, type FrameState, type ThreeContext, type ThreeSceneHooks } from "../three-scene/three-scene.tsx";
import { createActor, createBurst, createGroundShadow, PixelPass, type BurstOptions, type DiscLook, type Resolve, type VoxelActor, type VoxelBurst, type VoxelLook } from "./render.ts";
import type { VoxelModel } from "./volume.ts";

/* ------------------------------------------------------------------------------------------------ VoxelScene */

export type VoxelContext = Omit<ThreeContext, "scene"> & {
  /** What gets drawn as pixels. */
  scene: Scene;
  /** Adds a model. Its largest side becomes `size` scene units (2 by default). */
  add: (model: VoxelModel, size?: number) => VoxelActor;
  /** Adds a burst of cubes, placed with burst.mesh.position. */
  burst: (options?: BurstOptions) => VoxelBurst;
  /** Adds a round dithered shadow on the ground. */
  shadow: (radius: number) => ReturnType<typeof createGroundShadow>;
  /** Where the picture sits: `center` moves the models and the disc together, `radius` sizes the disc. */
  disc: { radius: number; center: [number, number] };
};

export type VoxelDisc = {
  /** Any CSS color. */
  color?: string;
  /** Share of the shorter side. */
  radius?: number;
  /** 0..1 from the left and from the top. */
  center?: readonly [number, number];
};

export type VoxelSceneProps = {
  /** Builds the scene. Runs once per mount: change the component's key to rebuild it. */
  setup: (ctx: VoxelContext) => ThreeSceneHooks | void | Promise<ThreeSceneHooks | void>;
  /** Side of one pixel of the picture, in CSS pixels. */
  pixel?: number;
  /** Color of the contour, or false for none. */
  outline?: string | false;
  /** A flat disc behind the models. */
  disc?: VoxelDisc | boolean;
  /** Steps of light on the surfaces. */
  bands?: number;
  /** Softness between the steps, 0 to 1. */
  dither?: number;
  /** How much single voxels differ in tone, 0 to 1. */
  grain?: number;
  light?: readonly [number, number, number];
  progress?: MotionValue<number>;
  loop?: "demand" | "always";
  fov?: number;
  fallback?: ReactNode;
  label?: string;
  className?: string;
  style?: CSSProperties;
};

const DISC: Required<VoxelDisc> = { color: "var(--pl-accent)", radius: 0.42, center: [0.5, 0.5] };

export function VoxelScene({
  setup,
  pixel = 4,
  outline = "#2a1720",
  disc = false,
  bands = 4,
  dither = 0.55,
  grain = 0.3,
  light = [-0.45, 0.8, 0.55],
  fov = 28,
  ...scene
}: VoxelSceneProps) {
  const live = useRef({ setup, pixel, outline, disc });
  live.current = { setup, pixel, outline, disc };

  const start = async (ctx: ThreeContext): Promise<ThreeSceneHooks> => {
    const look: VoxelLook = { bands, dither, grain, light };
    const stage = new Scene();
    const known = new Map<string, [number, number, number]>();
    const resolve: Resolve = (color) => {
      let rgb = known.get(color);
      if (!rgb) known.set(color, (rgb = cssColorToRgb(color, ctx.canvas)));
      return rgb;
    };
    const pass = new PixelPass(null);
    ctx.scene.add(pass.quad);
    const actors: VoxelActor[] = [];
    const prop = typeof disc === "object" ? { ...DISC, ...disc } : DISC;
    const discState = { radius: disc ? prop.radius : 0, center: [...prop.center] as [number, number] };
    const { scene: _quad, ...shared } = ctx;

    const hooks =
      (await live.current.setup({
        ...shared,
        scene: stage,
        disc: discState,
        add(model, size) {
          const actor = createActor(model, look, resolve, size);
          actors.push(actor);
          stage.add(actor.group);
          return actor;
        },
        burst(options) {
          const burst = createBurst(look, resolve, options);
          stage.add(burst.mesh);
          return burst;
        },
        shadow(radius) {
          const mesh = createGroundShadow(radius);
          stage.add(mesh);
          return mesh;
        },
      })) ?? {};

    return {
      frame(state) {
        hooks.frame?.(state);
        const now = live.current;
        const color = typeof now.disc === "object" ? (now.disc.color ?? DISC.color) : DISC.color;
        const shown: DiscLook | null = now.disc && discState.radius > 0 ? { color: resolve(color), ...discState } : null;
        pass.disc(shown);
        pass.outline(now.outline === false ? null : resolve(now.outline));
        pass.render(ctx.renderer, stage, ctx.camera, now.pixel, discState.center);
      },
      theme() {
        known.clear();
        for (const actor of actors) actor.recolor(resolve);
        hooks.theme?.();
      },
      dispose() {
        hooks.dispose?.();
        disposeObject(stage);
        pass.dispose();
      },
    };
  };

  return <ThreeScene {...scene} fov={fov} near={0.5} far={60} maxDpr={2} phoneMaxDpr={2} adaptive={false} setup={start} />;
}

/* ------------------------------------------------------------------------------------------------ VoxelView */

export type VoxelViewProps = Omit<VoxelSceneProps, "setup" | "progress" | "loop"> & {
  model: VoxelModel;
  /** Turns per minute while nobody is dragging. 0 stands still. */
  spin?: number;
  /** Drag and arrow keys. */
  interactive?: boolean;
  /** 0 is whole, 1 is apart. */
  explode?: number;
  /** Plays the voxels landing when it mounts. */
  build?: boolean;
  /** Extra room around the model. */
  margin?: number;
  /** Called before each frame, to move parts. */
  pose?: (actor: VoxelActor, state: FrameState) => void;
};

export function VoxelView({ model, spin = 4, interactive = true, explode = 0, build = false, margin = 1.15, pose, label, className, style, ...rest }: VoxelViewProps) {
  const reduced = useReducedMotion();
  const turn = useRef({ yaw: -0.6, pitch: 0.42, held: false, x: 0, y: 0 });
  const live = useRef({ spin, explode, pose });
  live.current = { spin, explode, pose };
  const still = useMotionValue(0);
  const nudge = useRef<() => void>(() => {});
  const apart = useRef(explode);

  useEffect(() => nudge.current(), [explode, spin]);

  const setup = (ctx: VoxelContext): ThreeSceneHooks => {
    const actor = ctx.add(model, 2);
    const shadow = ctx.shadow(Math.max(actor.size.x, actor.size.z) * 0.62);
    const bottom = -actor.size.y / 2;
    actor.group.position.y = bottom;
    shadow.position.y = bottom - 0.01;
    // Whole and apart have different centers and sizes: the camera eases between the two.
    const measure = (t: number) => {
      actor.explode(t);
      return new Box3().setFromObject(actor.group).getBoundingSphere(new Sphere());
    };
    const whole = measure(0);
    const open = measure(1);
    nudge.current = ctx.invalidate;
    let age = build && !reduced ? 0 : 1;
    return {
      frame(state) {
        const t = turn.current;
        if (!t.held && live.current.spin) t.yaw += (state.delta * (live.current.spin * Math.PI * 2)) / 60 * (reducedNow() ? 0 : 1);
        // Parts ease toward where explode wants them.
        const want = live.current.explode;
        const gap = want - apart.current;
        apart.current = reducedNow() || Math.abs(gap) < 0.002 ? want : apart.current + gap * Math.min(1, state.delta * 7);
        if (apart.current !== want) ctx.invalidate();
        actor.explode(apart.current);
        if (age < 1) {
          age = Math.min(1, age + state.delta / 1.4);
          ctx.invalidate();
        }
        actor.build(age);
        live.current.pose?.(actor, state);
        const vertical = (ctx.camera.fov * Math.PI) / 360;
        const horizontal = Math.atan(Math.tan(vertical) * ctx.camera.aspect);
        const a = apart.current;
        const radius = whole.radius + (open.radius - whole.radius) * a;
        const middle = whole.center.y + (open.center.y - whole.center.y) * a;
        const reach = (radius * margin) / Math.sin(Math.min(vertical, horizontal));
        ctx.camera.position.set(Math.sin(t.yaw) * Math.cos(t.pitch) * reach, middle + Math.sin(t.pitch) * reach, Math.cos(t.yaw) * Math.cos(t.pitch) * reach);
        ctx.camera.lookAt(0, middle, 0);
      },
      dispose() {
        nudge.current = () => {};
      },
    };
  };
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const reducedNow = () => reducedRef.current;

  const tilt = (dx: number, dy: number) => {
    const t = turn.current;
    t.yaw -= dx;
    t.pitch = Math.max(-0.2, Math.min(1.2, t.pitch + dy));
    nudge.current();
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    Object.assign(turn.current, { held: true, x: e.clientX, y: e.clientY });
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const t = turn.current;
    if (!t.held) return;
    tilt((e.clientX - t.x) * 0.01, e.pointerType === "touch" ? 0 : (e.clientY - t.y) * 0.008);
    Object.assign(t, { x: e.clientX, y: e.clientY });
  };
  const release = () => {
    turn.current.held = false;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, 0.12], ArrowDown: [0, -0.12] }[e.key];
    if (!step) return;
    e.preventDefault();
    tilt(step[0], step[1]);
  };

  return (
    <div
      {...(interactive
        ? { tabIndex: 0, onPointerDown, onPointerMove, onPointerUp: release, onPointerCancel: release, onKeyDown }
        : {})}
      role="img"
      aria-label={`${label ?? model.name}${interactive ? ". Drag or use the arrow keys to turn it" : ""}`}
      className={cn("size-full", interactive && "pl-focus-ring cursor-grab touch-pan-y rounded-lg active:cursor-grabbing", className)}
      style={style}
    >
      <VoxelScene key={model.id} {...rest} setup={setup} progress={still} loop={spin || pose ? "always" : "demand"} />
    </div>
  );
}
