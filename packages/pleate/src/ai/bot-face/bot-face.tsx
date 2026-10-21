// BotFace: an expressive assistant avatar. A soft flat body in the palette's accent with two pill eyes painted on an
// imaginary sphere, so glancing aside slides and foreshortens them towards the rim (evolved from Cronfiga's
// AgentFace). States show through eyes and body:
//   idle      — blinks, glances around, follows the pointer (track)
//   listening — eyes wide and attentive, rings pulse; with `level` (e.g. useAudioLevel) they follow your voice
//   thinking  — looks up and aside, sways, particles orbit
//   speaking  — bounces, eyes alternate; with `level` they move with the speech
//   waiting   — looks down at what needs you and hops now and then
//   happy · error · offline
// `seed` picks one of five body shapes; `color` overrides the accent. Reduced motion keeps the poses still.
"use client";

import {
  animate as run,
  cancelFrame,
  frame,
  isMotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type BotState = "idle" | "listening" | "thinking" | "speaking" | "waiting" | "happy" | "error" | "offline";

// ---- Bodies -------------------------------------------------------------------------------------------------------

type Shape = "circle" | "blob" | "squircle" | "pill" | "lump";
// Superellipse radii and exponent, wobble harmonics [k, amplitude, phase] and the center of the eyes' sphere.
const SHAPES: Record<Shape, { rx: number; ry: number; n: number; wobble: [number, number, number][]; cy: number }> = {
  circle: { rx: 43, ry: 43, n: 2, wobble: [], cy: 50 },
  blob: { rx: 44, ry: 40, n: 2.2, wobble: [[2, 0.05, 2.6], [3, 0.035, 0.4]], cy: 51 },
  squircle: { rx: 42, ry: 41, n: 2.9, wobble: [[2, 0.02, 1], [3, 0.02, 2]], cy: 50 },
  pill: { rx: 46, ry: 30, n: 2.6, wobble: [[2, 0.02, 0.6]], cy: 52 },
  lump: { rx: 43, ry: 40, n: 2.5, wobble: [[2, 0.03, 4.4], [3, 0.045, 1.3], [4, 0.015, 0.5]], cy: 51 },
};

function rim({ rx, ry, n, wobble, cy }: (typeof SHAPES)[Shape], a: number) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const r = 1 + wobble.reduce((sum, [k, amp, phase]) => sum + amp * Math.cos(k * a + phase), 0);
  const round = (v: number) => Math.round(v * 100) / 100; // same numbers on server and client
  return [round(50 + r * rx * Math.sign(c) * Math.abs(c) ** (2 / n)), round(cy + r * ry * Math.sign(s) * Math.abs(s) ** (2 / n))];
}

// Closed path through the sampled outline, smoothed as Catmull-Rom splines.
function outline(shape: (typeof SHAPES)[Shape]) {
  const points = Array.from({ length: 48 }, (_, i) => rim(shape, (i / 48) * Math.PI * 2));
  const f = (v: number) => v.toFixed(2);
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  points.forEach((_, i) => {
    const [p0, p1, p2, p3] = [-1, 0, 1, 2].map((o) => points[(i + o + points.length) % points.length]);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  });
  return `${d}Z`;
}
const PATHS = Object.fromEntries(Object.entries(SHAPES).map(([k, v]) => [k, outline(v)])) as Record<Shape, string>;
const DOTS = Object.fromEntries(Object.entries(SHAPES).map(([k, v]) => [k, rim(v, Math.PI / 4)])) as Record<Shape, number[]>;

function shapeFor(seed?: string): Shape {
  if (!seed) return "circle";
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const shapes = Object.keys(SHAPES) as Shape[];
  return shapes[h % shapes.length];
}

// ---- Eyes ---------------------------------------------------------------------------------------------------------

// One eye on its patch of the sphere: pill width and length, tilt in degrees, shift down along the face.
type Eye = { w: number; h: number; rot: number; dy: number };
type Pose = { yaw: number; pitch: number; eyes: [Eye, Eye]; joy: number };
const eye = (h: number, rot = 0, w = 10, dy = 0): Eye => ({ w, h, rot, dy });

const POSE: Record<BotState, Pose> = {
  idle: { yaw: -0.4, pitch: -0.1, eyes: [eye(21, 6), eye(18, 9)], joy: 0 },
  listening: { yaw: 0, pitch: -0.06, eyes: [eye(23, 0, 11), eye(23, 0, 11)], joy: 0 },
  thinking: { yaw: 0.42, pitch: -0.5, eyes: [eye(11, -8, 10.5), eye(21, -4)], joy: 0 },
  speaking: { yaw: 0.1, pitch: 0.06, eyes: [eye(20), eye(20)], joy: 0 },
  waiting: { yaw: 0.34, pitch: 0.46, eyes: [eye(22, 3, 11), eye(22, 5, 11)], joy: 0 },
  happy: { yaw: 0, pitch: -0.08, eyes: [eye(19, 0, 9.5), eye(19, 0, 9.5)], joy: 1 },
  error: { yaw: 0, pitch: 0.12, eyes: [eye(15, -55, 9.5, -1), eye(15, 55, 9.5, -1)], joy: 0 },
  offline: { yaw: -0.06, pitch: 0.22, eyes: [eye(13, 90, 6, 3), eye(13, 90, 6, 3)], joy: 0 },
};
const SPREAD = 0.25; // half the angle between the eyes on the sphere
const random = (min: number, max: number) => min + Math.random() * (max - min);

// Where eye `side` lands for a gaze: an SVG matrix mapping the eye's flat patch onto a sphere stretched to the body,
// seen from the front — near the rim it slides along the edge and gets foreshortened.
function eyeMatrix(shape: Shape, side: -1 | 1, yaw: number, pitch: number, e: Eye, scale: number) {
  const { rx, ry, cy } = SHAPES[shape];
  const a = side * SPREAD;
  const cY = Math.cos(yaw), sY = Math.sin(yaw), cP = Math.cos(pitch), sP = Math.sin(pitch);
  const turn = ([x, y, z]: number[]) => {
    const x1 = x * cY + z * sY;
    const z1 = -x * sY + z * cY;
    return [x1, y * cP + z1 * sP];
  };
  const p = turn([Math.sin(a), 0, Math.cos(a)]);
  const t = turn([Math.cos(a), 0, -Math.sin(a)]);
  const d = turn([0, 1, 0]);
  const tilt = (e.rot * Math.PI) / 180, cT = Math.cos(tilt), sT = Math.sin(tilt);
  const u = [t[0] * cT + d[0] * sT, t[1] * cT + d[1] * sT];
  const v = [-t[0] * sT + d[0] * cT, -t[1] * sT + d[1] * cT];
  const shift = e.dy * scale;
  const f = (n: number) => n.toFixed(3);
  return `matrix(${f(u[0])} ${f(u[1])} ${f(v[0])} ${f(v[1])} ${f(50 + p[0] * rx * 0.84 + d[0] * shift)} ${f(cy + p[1] * ry * 0.84 + d[1] * shift)})`;
}

const eyeScale = (size: number) => (size <= 28 ? 1.3 : size <= 36 ? 1.18 : size <= 56 ? 1.06 : 1);
const ARC = (w: number, h: number) => `M${-h * 0.42} ${w * 0.25}Q0 ${-w * 0.75} ${h * 0.42} ${w * 0.25}`;

function paintEye(rect: SVGRectElement, arc: SVGPathElement, matrix: string, e: Eye, joy: number) {
  const h = Math.max(e.h, 0.5);
  rect.setAttribute("x", (-e.w / 2).toFixed(2));
  rect.setAttribute("y", (-h / 2).toFixed(2));
  rect.setAttribute("width", e.w.toFixed(2));
  rect.setAttribute("height", h.toFixed(2));
  rect.setAttribute("rx", (Math.min(e.w, h) / 2).toFixed(2));
  rect.setAttribute("transform", matrix);
  rect.style.opacity = String(1 - joy);
  arc.setAttribute("transform", matrix);
  arc.style.opacity = String(joy);
}

// ---- Component ----------------------------------------------------------------------------------------------------

const DEFAULT_LABELS: Record<BotState, string> = {
  idle: "Assistant",
  listening: "Assistant is listening",
  thinking: "Assistant is thinking",
  speaking: "Assistant is responding",
  waiting: "Assistant is waiting for you",
  happy: "Assistant is happy",
  error: "Assistant ran into a problem",
  offline: "Assistant is offline",
};

export type BotFaceProps = {
  state?: BotState;
  /** Side in px: 24 for an avatar, up to a hero. */
  size?: number;
  /** 0–1 loudness (a number, or a MotionValue from useAudioLevel) driving listening and speaking. */
  level?: number | MotionValue<number>;
  /** Eyes follow the pointer while idle. One window listener per face: keep it to the large ones. */
  track?: boolean;
  /** false: the still pose, no motion and no listeners. */
  animated?: boolean;
  /** Picks another body shape, stable for the same string. */
  seed?: string;
  /** Body color (any CSS color); defaults to the palette accent. */
  color?: string;
  /** Eye color; defaults to the palette's on-accent (readable on any accent). */
  eyeColor?: string;
  /** Presence dot colored by state. */
  dot?: boolean;
  /** Next to a visible name: hide from assistive tech. */
  decorative?: boolean;
  labels?: Partial<Record<BotState, string>>;
  className?: string;
};

const DOT_COLOR: Record<BotState, string> = {
  idle: "var(--pl-success-vivid)",
  listening: "var(--pl-danger-ink)",
  thinking: "var(--pl-info-ink)",
  speaking: "var(--pl-info-ink)",
  waiting: "var(--pl-warning-ink)",
  happy: "var(--pl-success-vivid)",
  error: "var(--pl-danger)",
  offline: "var(--pl-fg-subtle)",
};

function bodyFill(state: BotState, color?: string) {
  if (state === "error") return "var(--pl-danger)";
  if (state === "offline") return "var(--pl-fg-subtle)";
  return color ?? "var(--pl-accent)";
}
function eyeFill(state: BotState, color?: string, eyeColor?: string) {
  if (state === "error" || state === "offline") return "var(--pl-on-status)";
  return eyeColor ?? (color ? "#ffffff" : "var(--pl-on-accent)");
}

export function BotFace({ animated = true, ...props }: BotFaceProps) {
  return animated ? <LiveFace {...props} /> : <StillFace {...props} />;
}

function Frame({
  state,
  size,
  decorative,
  dot,
  shape,
  color,
  eyeColor,
  labels,
  className,
  children,
}: Omit<BotFaceProps, "track" | "animated" | "seed" | "level"> & { state: BotState; size: number; shape: Shape; children: React.ReactNode }) {
  const label = labels?.[state] ?? DEFAULT_LABELS[state];
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      data-state={state}
      className={cn("block shrink-0 overflow-visible", className)}
      style={{ "--pl-bot": bodyFill(state, color), "--pl-bot-eye": eyeFill(state, color, eyeColor) } as CSSProperties}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label })}
    >
      {children}
      {dot && (
        <circle
          cx={DOTS[shape][0]}
          cy={DOTS[shape][1]}
          r={7}
          fill={DOT_COLOR[state]}
          stroke="var(--pl-surface)"
          strokeWidth={3.5}
          className={cn(
            "[transform-box:fill-box] [transform-origin:center]",
            (state === "thinking" || state === "speaking" || state === "listening" || state === "waiting") &&
              "motion-safe:animate-[pl-pulse_1.4s_ease-in-out_infinite]",
          )}
        />
      )}
    </svg>
  );
}

function Body({ shape }: { shape: Shape }) {
  return <path d={PATHS[shape]} fill="var(--pl-bot)" style={{ transition: "fill 0.35s ease" }} />;
}

function StillFace({ state = "idle", size = 64, seed, ...rest }: Omit<BotFaceProps, "animated" | "track">) {
  const shape = shapeFor(seed);
  const pose = POSE[state];
  const k = eyeScale(size);
  return (
    <Frame state={state} size={size} shape={shape} {...rest}>
      <Body shape={shape} />
      {pose.eyes.map((e, i) => {
        const scaled = { ...e, w: e.w * k, h: e.h * k };
        const matrix = eyeMatrix(shape, i ? 1 : -1, pose.yaw, pose.pitch, scaled, k);
        return pose.joy ? (
          <path key={i} d={ARC(scaled.w, scaled.h)} transform={matrix} fill="none" stroke="var(--pl-bot-eye)" strokeLinecap="round" style={{ strokeWidth: scaled.w }} />
        ) : (
          <rect key={i} x={-scaled.w / 2} y={-scaled.h / 2} width={scaled.w} height={scaled.h} rx={Math.min(scaled.w, scaled.h) / 2} transform={matrix} fill="var(--pl-bot-eye)" />
        );
      })}
    </Frame>
  );
}

const SPRING = { stiffness: 190, damping: 17, mass: 0.7 };

function useEyeValues() {
  const w = useMotionValue(0), h = useMotionValue(0), rot = useMotionValue(0), dy = useMotionValue(0);
  return { w, h, rot, dy } as Record<keyof Eye, MotionValue<number>>;
}

function bodyLoop(state: BotState, driven: boolean) {
  const forever = (duration: number, repeatDelay = 0) => ({ duration, repeat: Infinity, repeatDelay, ease: "easeInOut" as const });
  const rest = { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 };
  switch (state) {
    case "thinking":
      return { animate: { ...rest, rotate: [-4, 4, -4] }, transition: forever(3.2) };
    case "speaking":
      // With a live level the body follows the voice instead of a canned bounce.
      return driven
        ? { animate: rest, transition: { type: "spring" as const, ...SPRING } }
        : { animate: { ...rest, y: [0, -3.5, 0, -1.5, 0], scaleY: [1, 1.035, 0.965, 1.015, 1], scaleX: [1, 0.975, 1.03, 0.99, 1] }, transition: forever(0.9) };
    case "listening":
      return driven ? { animate: rest, transition: { type: "spring" as const, ...SPRING } } : { animate: { ...rest, scaleY: [1, 1.02, 1], scaleX: [1, 1.01, 1] }, transition: forever(1.6) };
    case "waiting":
      return { animate: { ...rest, y: [0, 1, -7, 0, 0], scaleY: [1, 0.9, 1.07, 0.95, 1], scaleX: [1, 1.08, 0.95, 1.04, 1] }, transition: { ...forever(0.75, 2.2), times: [0, 0.2, 0.5, 0.8, 1] } };
    case "happy":
      return { animate: { ...rest, y: [0, 2, -11, 0, -3, 0], scaleY: [1, 0.86, 1.1, 0.92, 1.03, 1], scaleX: [1, 1.12, 0.93, 1.07, 0.98, 1] }, transition: forever(1.1, 1.4) };
    case "error":
      return { animate: { ...rest, x: [0, -3.5, 3.5, -2.5, 2, 0], rotate: [0, -3, 3, -2, 1, 0] }, transition: forever(0.5, 2.6) };
    case "idle":
      return { animate: { ...rest, scaleY: [1, 1.018, 1], scaleX: [1, 0.99, 1] }, transition: forever(4) };
    default:
      return { animate: rest, transition: { type: "spring" as const, ...SPRING } };
  }
}

function LiveFace({ state = "idle", size = 64, track = false, seed, level, ...rest }: Omit<BotFaceProps, "animated">) {
  const shape = shapeFor(seed);
  const root = useRef<SVGGElement>(null);
  const rects = useRef<(SVGRectElement | null)[]>([]);
  const arcs = useRef<(SVGPathElement | null)[]>([]);
  const reduced = useReducedMotion();
  const pose = POSE[state];
  const k = eyeScale(size);
  const driven = level !== undefined;

  // Loudness, smoothed so the face breathes with the voice rather than jittering.
  const rawLevel = useMotionValue(typeof level === "number" ? level : 0);
  const loud = useSpring(rawLevel, { stiffness: 300, damping: 28 });
  useEffect(() => {
    if (level === undefined) return rawLevel.set(0);
    if (isMotionValue(level)) {
      const source = level as MotionValue<number>;
      rawLevel.set(source.get());
      return source.on("change", (v) => rawLevel.set(v));
    }
    rawLevel.set(level as number);
  }, [level, rawLevel]);
  const reactive = driven && (state === "listening" || state === "speaking") && !reduced;
  const bodyScale = useTransform(loud, (v) => (reactive ? 1 + v * (state === "speaking" ? 0.06 : 0.04) : 1));
  const ringScale = useTransform(loud, (v) => 1 + v * 0.22);
  const ringOpacity = useTransform(loud, (v) => 0.12 + v * 0.4);

  const yawTarget = useMotionValue(reduced ? pose.yaw : pose.yaw + 0.55);
  const pitchTarget = useMotionValue(reduced ? pose.pitch : pose.pitch - 0.2);
  const yaw = useSpring(yawTarget, SPRING);
  const pitch = useSpring(pitchTarget, SPRING);
  const left = useEyeValues();
  const right = useEyeValues();
  const blink = useMotionValue(1);
  const alt = useMotionValue(0);
  const joy = useMotionValue(pose.joy);

  // Paint the eyes once per frame whenever any input moves.
  useEffect(() => {
    let scheduled = false;
    const paint = () => {
      scheduled = false;
      const j = joy.get();
      const l = reactive ? loud.get() : 0;
      [left, right].forEach((v, i) => {
        const rect = rects.current[i];
        const arc = arcs.current[i];
        if (!rect || !arc) return;
        const swing = 1 + 0.2 * alt.get() * (i ? -1 : 1);
        const voice = !reactive ? 1 : state === "listening" ? 1 + 0.32 * l : 0.72 + 0.55 * l;
        const e = { w: v.w.get() * k, h: v.h.get() * k * blink.get() * swing * voice, rot: v.rot.get(), dy: v.dy.get() };
        paintEye(rect, arc, eyeMatrix(shape, i ? 1 : -1, yaw.get(), pitch.get(), e, k), e, j);
        arc.setAttribute("d", ARC(e.w, v.h.get() * k));
        arc.style.strokeWidth = String(e.w);
      });
    };
    const schedule = () => {
      if (!scheduled) {
        scheduled = true;
        frame.render(paint);
      }
    };
    const values = [yaw, pitch, blink, alt, joy, loud, ...Object.values(left), ...Object.values(right)];
    const offs = values.map((v) => v.on("change", schedule));
    paint();
    return () => {
      offs.forEach((off) => off());
      cancelFrame(paint);
    };
  }, [shape, k, yaw, pitch, blink, alt, joy, left, right, loud, reactive, state]);

  // Morph the eyes into the state's pose.
  useEffect(() => {
    const opts = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 320, damping: 20 };
    const controls = [left, right].flatMap((v, i) => (Object.keys(v) as (keyof Eye)[]).map((key) => run(v[key], pose.eyes[i][key], opts)));
    controls.push(run(joy, pose.joy, reduced ? { duration: 0 } : { duration: 0.25 }));
    return () => controls.forEach((c) => c.stop());
  }, [pose, reduced, left, right, joy]);

  // What keeps the gaze alive: glances, the speaking eyes, the pointer.
  useEffect(() => {
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    const restPose = () => {
      yawTarget.set(pose.yaw);
      pitchTarget.set(pose.pitch);
    };
    if (reduced) {
      restPose();
      yaw.jump(pose.yaw);
      pitch.jump(pose.pitch);
      alt.set(0);
      return;
    }
    later(restPose, 380);
    let lastPointer = 0;
    if (state === "idle") {
      const glance = () => {
        if (Date.now() - lastPointer > 2500) {
          yawTarget.set(Math.random() < 0.5 ? random(-0.6, -0.3) : random(0.25, 0.55));
          pitchTarget.set(random(-0.15, 0.2));
          later(() => Date.now() - lastPointer > 2500 && restPose(), random(900, 1600));
        }
        later(glance, random(3000, 5200));
      };
      later(glance, random(1800, 3000));
    }
    if (state === "thinking") {
      // Eyes drift between two "searching" spots, as if reading an invisible page.
      const scan = (side: number) => {
        yawTarget.set(side * random(0.3, 0.5));
        pitchTarget.set(random(-0.55, -0.35));
        later(() => scan(-side), random(1100, 1700));
      };
      later(() => scan(-1), 900);
    }
    if (state === "listening") {
      // Small attentive tilts.
      const nod = () => {
        pitchTarget.set(pose.pitch + random(-0.06, 0.08));
        yawTarget.set(random(-0.08, 0.08));
        later(nod, random(1400, 2400));
      };
      later(nod, 1200);
    }
    if (state === "waiting") {
      const peek = () => {
        yawTarget.set(-0.05);
        pitchTarget.set(0);
        later(restPose, 650);
        later(peek, random(4500, 7000));
      };
      later(peek, random(3500, 5000));
    }
    const swing = state === "speaking" && !driven ? run(alt, [0, 1, 0, -1, 0], { duration: 0.9, repeat: Infinity, ease: "easeInOut" }) : null;
    if (!swing) alt.set(0);
    let raf = 0;
    const onMove = (event: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const box = root.current?.ownerSVGElement?.getBoundingClientRect();
        if (!box) return;
        const dx = (event.clientX - (box.left + box.width / 2)) / (window.innerWidth / 2);
        const dy = (event.clientY - (box.top + box.height / 2)) / (window.innerHeight / 2);
        lastPointer = Date.now();
        yawTarget.set(Math.max(-1, Math.min(1, dx * 1.6)) * 0.65);
        pitchTarget.set(Math.max(-1, Math.min(1, dy * 1.6)) * 0.5);
      });
    };
    const follow = track && state === "idle";
    if (follow) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      swing?.stop();
      if (raf) cancelAnimationFrame(raf);
      if (follow) window.removeEventListener("pointermove", onMove);
    };
  }, [state, reduced, track, pose, yaw, pitch, yawTarget, pitchTarget, alt, driven]);

  // Blinks every 3–6 s, sometimes twice.
  useEffect(() => {
    if (reduced || state === "happy" || state === "offline" || state === "error") return;
    let timer = 0;
    const once = () => run(blink, [1, 0.1, 1], { duration: 0.18, times: [0, 0.45, 1], ease: "easeInOut" });
    const next = () => {
      timer = window.setTimeout(() => {
        void once().then(() => {
          if (Math.random() < 0.2) void once();
        });
        next();
      }, random(3000, 6000));
    };
    next();
    return () => window.clearTimeout(timer);
  }, [state, reduced, blink]);

  const loop = bodyLoop(state, driven);
  const center = { transformBox: "view-box", transformOrigin: "50px 50px" } as const;
  return (
    <Frame state={state} size={size} shape={shape} {...rest}>
      {/* Listening rings: follow the voice when there is a level, breathe otherwise. */}
      {state === "listening" && !reduced && (
        <g aria-hidden="true">
          {[0, 1].map((i) =>
            driven ? (
              <motion.circle
                key={i}
                cx={50}
                cy={SHAPES[shape].cy}
                r={48 + i * 8}
                fill="none"
                stroke="var(--pl-bot)"
                strokeWidth={2}
                style={{ ...center, scale: ringScale, opacity: ringOpacity }}
              />
            ) : (
              <motion.circle
                key={i}
                cx={50}
                cy={SHAPES[shape].cy}
                r={48}
                fill="none"
                stroke="var(--pl-bot)"
                strokeWidth={2}
                style={center}
                initial={{ scale: 1, opacity: 0.45 }}
                animate={{ scale: 1.35, opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.9, ease: "easeOut" }}
              />
            ),
          )}
        </g>
      )}
      {/* Thinking particles orbiting the head. */}
      {state === "thinking" && !reduced && (
        <motion.g aria-hidden="true" style={center} animate={{ rotate: 360 }} transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}>
          {[0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2;
            return <circle key={i} cx={50 + Math.cos(a) * 56} cy={50 + Math.sin(a) * 56} r={3.4 - i * 0.7} fill="var(--pl-bot)" opacity={0.8 - i * 0.2} />;
          })}
        </motion.g>
      )}
      {/* Appears, lands with a squash, then settles into the state's motion. */}
      <motion.g
        ref={root}
        style={{ originX: 0.5, originY: 1 }}
        initial={reduced ? false : { scale: 0.2, opacity: 0, y: -14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 13, mass: 0.8 }}
      >
        <motion.g style={{ ...center, scale: bodyScale }}>
          <motion.g
            style={{ originX: 0.5, originY: 1 }}
            initial={false}
            animate={reduced ? { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 } : loop.animate}
            transition={reduced ? { duration: 0 } : loop.transition}
          >
            <Body shape={shape} />
            {[0, 1].map((i) => (
              <g key={i}>
                <rect ref={(el) => { rects.current[i] = el; }} fill="var(--pl-bot-eye)" />
                <path ref={(el) => { arcs.current[i] = el; }} fill="none" stroke="var(--pl-bot-eye)" strokeLinecap="round" />
              </g>
            ))}
          </motion.g>
        </motion.g>
      </motion.g>
    </Frame>
  );
}
