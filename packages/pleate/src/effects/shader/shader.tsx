// ShaderCanvas: a full-size WebGL2 canvas that runs one fragment shader. It is the base of pleate's animated
// backgrounds. It handles size and device pixel ratio, pauses off screen and in hidden tabs, draws one still frame
// for reduced motion, and passes the pointer and palette colors in. Without WebGL2 it renders nothing, so put a
// plain background behind it.
//
// Uniforms every shader gets: uTime (seconds), uResolution (px, with DPR), uPointer (0..1, origin bottom left,
// eased), uPointerActive (0..1), uAccent / uFg / uBg (palette colors as linear-ish rgb 0..1). Add your own with
// `uniforms` (numbers, [x,y], [x,y,z], [x,y,z,w]); they are read every frame, so pass a ref'd object to animate.
"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type UniformValue = number | readonly [number, number] | readonly [number, number, number] | readonly [number, number, number, number];

export type ShaderCanvasProps = {
  /** GLSL ES 3.00 fragment body: everything after the shared header (precision, uniforms, `out vec4 fragColor`). */
  fragment: string;
  uniforms?: Record<string, UniformValue>;
  /** Playback speed multiplier. */
  speed?: number;
  /** Cap on the device pixel ratio (shaders are fill-rate bound). */
  maxDpr?: number;
  /** Follow the pointer over the canvas's parent (the canvas itself ignores pointer events). */
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
};

const VERTEX = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

/** Prepended to every fragment shader. */
export const SHADER_HEADER = `#version 300 es
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uPointerActive;
uniform vec3 uAccent;
uniform vec3 uFg;
uniform vec3 uBg;
out vec4 fragColor;
`;

/** Common GLSL helpers (hash, value noise, fbm, palette rotation). Include with `${SHADER_NOISE}` in your body. */
export const SHADER_NOISE = `
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
`;

/** Reads a CSS color (any syntax the browser knows, tokens included) as rgb 0..1. */
export function cssColorToRgb(color: string, el: Element = document.documentElement): [number, number, number] {
  const probe = document.createElement("span");
  probe.style.color = color;
  probe.style.display = "none";
  el.appendChild(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return [0, 0, 0];
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("pleate ShaderCanvas:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function ShaderCanvas({ fragment, uniforms, speed = 1, maxDpr = 1.5, interactive = true, className, style }: ShaderCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const live = useRef({ uniforms, speed });
  live.current = { uniforms, speed };

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl2", { premultipliedAlpha: true, antialias: false });
    if (!canvas || !gl) return;
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, SHADER_HEADER + fragment);
    if (!vs || !fs) return;
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("pleate ShaderCanvas:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const loc = (name: string) => gl.getUniformLocation(program, name);
    const uTime = loc("uTime"), uRes = loc("uResolution"), uPointer = loc("uPointer"), uActive = loc("uPointerActive");
    const custom = new Map<string, WebGLUniformLocation | null>();

    let frame = 0;
    // Reduced motion draws one frame only, so anything that changes the picture has to ask for another.
    const still = () => {
      if (!reduced) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame((now) => draw(now));
    };
    const readColors = () => {
      gl.uniform3fv(loc("uAccent"), cssColorToRgb("var(--pl-accent)", canvas));
      gl.uniform3fv(loc("uFg"), cssColorToRgb("var(--pl-fg)", canvas));
      gl.uniform3fv(loc("uBg"), cssColorToRgb("var(--pl-bg)", canvas));
      still();
    };
    readColors();
    // Theme and palette switches change the tokens on <html>.
    const themeWatch = new MutationObserver(readColors);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "style", "class"] });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        // Resizing clears the canvas; the still frame has to be drawn again.
        still();
      }
      gl.viewport(0, 0, w, h);
    };
    const sizeWatch = new ResizeObserver(resize);
    sizeWatch.observe(canvas);

    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: 0, tActive: 0 };
    const host = canvas.parentElement ?? canvas;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.tx = (e.clientX - r.left) / r.width;
      pointer.ty = 1 - (e.clientY - r.top) / r.height;
      pointer.tActive = 1;
    };
    const onLeave = () => (pointer.tActive = 0);
    if (interactive) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
    }

    let visible = true;
    const viewWatch = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    viewWatch.observe(canvas);

    let time = 0;
    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!visible || document.hidden) {
        frame = requestAnimationFrame(draw);
        return;
      }
      time += dt * live.current.speed;
      const ease = 1 - Math.exp(-dt * 8);
      pointer.x += (pointer.tx - pointer.x) * ease;
      pointer.y += (pointer.ty - pointer.y) * ease;
      pointer.active += (pointer.tActive - pointer.active) * ease;
      resize();
      gl.uniform1f(uTime, time);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.uniform1f(uActive, pointer.active);
      for (const [name, value] of Object.entries(live.current.uniforms ?? {})) {
        if (!custom.has(name)) custom.set(name, loc(name));
        const l = custom.get(name)!;
        if (typeof value === "number") gl.uniform1f(l, value);
        else if (value.length === 2) gl.uniform2fv(l, value);
        else if (value.length === 3) gl.uniform3fv(l, value);
        else gl.uniform4fv(l, value);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    // Reduced motion: one still frame, a little way into the animation so it is not a blank start.
    if (reduced) time = 4;
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      themeWatch.disconnect();
      sizeWatch.disconnect();
      viewWatch.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [fragment, maxDpr, interactive, reduced]);

  return <canvas ref={ref} aria-hidden="true" className={cn("pointer-events-none block size-full", className)} style={style} />;
}
