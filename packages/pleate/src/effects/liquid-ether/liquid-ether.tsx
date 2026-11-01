// LiquidEther: colored smoke stirred by the pointer, a small fluid simulation on the GPU (WebGL2, half float
// textures). Each frame carries dye and a color index along a swirling curl noise flow plus the pointer's
// impulses, and splats where the pointer moves; with no pointer an invisible stirrer wanders on its own.
// shortcut: no Navier Stokes solve (impulses diffuse and fade, no pressure projection), enough for a soft
// background; add advection and a Jacobi pressure pass if it ever needs to look like real fluid.
// Fills its parent, decorative (aria-hidden), pauses off screen, settles a still frame for reduced motion. Needs
// WebGL2 with EXT_color_buffer_float; without it nothing renders, so keep a plain background behind it.
"use client";

import { useEffect, useRef } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { useCssColors, type BackgroundProps } from "../background-kit/background-kit.tsx";
import { SHADER_NOISE } from "../shader/shader.tsx";

export type LiquidEtherProps = BackgroundProps & {
  /** Force the pointer puts into the fluid. */
  force?: number;
  /** Splat radius as a share of the short side. */
  radius?: number;
  /** How long the dye lingers: higher fades slower. */
  persistence?: number;
  /** Stir by itself when there is no pointer. */
  autoDemo?: boolean;
};

const VERTEX = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

// State texture: xy velocity (uv per second), z dye amount, w color index 0..1.
const SIM = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uSize;
uniform float uDt, uTime, uFade, uRadius, uAspect, uScale;
uniform vec2 uSplat, uForce;
uniform float uSplatOn, uHue;
out vec4 o;
${SHADER_NOISE}
void main() {
  vec2 uv = gl_FragCoord.xy / uSize;
  vec2 px = 1.0 / uSize;
  vec4 s = texture(uState, uv);
  // Curl of a drifting noise field: divergence free, so the dye swirls without piling up.
  vec2 q = uv * vec2(uAspect, 1.0) * 2.5 / uScale + uTime * 0.04;
  float e = 0.01;
  float nx = fbm(q + vec2(0, e)) - fbm(q - vec2(0, e));
  float ny = fbm(q + vec2(e, 0)) - fbm(q - vec2(e, 0));
  vec2 curl = vec2(nx, -ny) / (2.0 * e) * vec2(1.0 / uAspect, 1.0) * 0.06;
  vec4 a = texture(uState, uv - (s.xy + curl) * uDt);
  vec4 n = (texture(uState, uv + vec2(px.x, 0)) + texture(uState, uv - vec2(px.x, 0)) + texture(uState, uv + vec2(0, px.y)) + texture(uState, uv - vec2(0, px.y))) * 0.25;
  // Pointer impulses spread and fade instead of self advecting (self advection without projection forms shocks).
  vec2 v = mix(s.xy, n.xy, 0.25) * exp(-uDt * 1.5);
  float dye = a.z * exp(-uDt * uFade);
  float hue = a.w;
  vec2 d = (uv - uSplat) * vec2(uAspect, 1.0);
  float g = exp(-dot(d, d) / (uRadius * uRadius)) * uSplatOn;
  v += uForce * g;
  dye += g * uDt * 20.0;
  hue = mix(hue, uHue, clamp(g * 1.5, 0.0, 1.0));
  o = vec4(clamp(v, -1.2, 1.2), min(dye, 2.5), hue);
}`;

const SHOW = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uView;
uniform vec3 uC0, uC1, uC2, uBg;
out vec4 o;
void main() {
  vec4 s = texture(uState, gl_FragCoord.xy / uView);
  float h = fract(s.w);
  vec3 c = h < 0.333 ? mix(uC0, uC1, h * 3.0) : h < 0.667 ? mix(uC1, uC2, h * 3.0 - 1.0) : mix(uC2, uC0, h * 3.0 - 2.0);
  float i = 1.0 - exp(-s.z * 1.6);
  o = vec4(mix(uBg, c, i * 0.95) + length(s.xy) * 0.04 * c, 1.0);
}`;

function program(gl: WebGL2RenderingContext, fs: string) {
  const p = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, fs]] as const) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error("pleate LiquidEther:", gl.getShaderInfoLog(sh));
    gl.attachShader(p, sh);
    gl.deleteShader(sh);
  }
  gl.bindAttribLocation(p, 0, "aPos");
  gl.linkProgram(p);
  return p;
}

/** Colors: three dye colors plus the backdrop (default: accent ramp and page background). */
export function LiquidEther({ colors, speed = 1, scale = 1, interactive = true, force = 1, radius = 0.1, persistence = 1, autoDemo = true, className, style }: LiquidEtherProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const defaults = ["var(--pl-accent-300)", "var(--pl-accent)", "var(--pl-accent-700)", "var(--pl-bg)"];
  const rgb = useCssColors(defaults.map((d, i) => colors?.[i] ?? d));
  const live = useRef({ rgb, speed, scale, force, radius, persistence, autoDemo });
  live.current = { rgb, speed, scale, force, radius, persistence, autoDemo };

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl2", { antialias: false, alpha: false });
    if (!canvas || !gl || !gl.getExtension("EXT_color_buffer_float")) return;
    const sim = program(gl, SIM), show = program(gl, SHOW);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const U = (p: WebGLProgram) => (name: string) => gl.getUniformLocation(p, name);
    const us = U(sim), ud = U(show);

    // Ping-pong state targets at a fraction of the canvas size.
    let targets: { tex: WebGLTexture; fbo: WebGLFramebuffer }[] = [];
    let simW = 0, simH = 0, cur = 0;
    const makeTargets = () => {
      for (const t of targets) (gl.deleteTexture(t.tex), gl.deleteFramebuffer(t.fbo));
      targets = [0, 1].map(() => {
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, simW, simH, 0, gl.RGBA, gl.HALF_FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const fbo = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return { tex, fbo };
      });
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const sw = Math.max(16, Math.round(w / 4)), sh = Math.max(16, Math.round(h / 4));
      if (sw !== simW || sh !== simH) {
        simW = sw;
        simH = sh;
        makeTargets();
      }
    };

    const pointer = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, active: false, moved: false };
    const host = canvas.parentElement ?? canvas;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / r.width;
      pointer.y = 1 - (e.clientY - r.top) / r.height;
      if (!pointer.active) (pointer.px = pointer.x), (pointer.py = pointer.y);
      pointer.active = pointer.moved = true;
    };
    const onLeave = () => (pointer.active = false);
    if (interactive && !reduced) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
    }

    let time = 0;
    const step = (dt: number) => {
      const o = live.current;
      time += dt;
      let sx = pointer.x, sy = pointer.y, fx = 0, fy = 0, on = 0;
      if (pointer.active && pointer.moved) {
        fx = ((pointer.x - pointer.px) / Math.max(dt, 1e-3)) * 0.1 * o.force;
        fy = ((pointer.y - pointer.py) / Math.max(dt, 1e-3)) * 0.1 * o.force;
        on = 1;
      } else if (!pointer.active && o.autoDemo) {
        sx = 0.5 + Math.sin(time * 0.53) * 0.32 + Math.sin(time * 1.31) * 0.08;
        sy = 0.5 + Math.cos(time * 0.71) * 0.28;
        fx = Math.cos(time * 0.53) * 0.53 * 0.32 * o.force;
        fy = -Math.sin(time * 0.71) * 0.71 * 0.28 * o.force;
        on = 0.6;
      }
      pointer.px = pointer.x;
      pointer.py = pointer.y;
      pointer.moved = false;
      gl.useProgram(sim);
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets[1 - cur].fbo);
      gl.viewport(0, 0, simW, simH);
      gl.bindTexture(gl.TEXTURE_2D, targets[cur].tex);
      gl.uniform1i(us("uState"), 0);
      gl.uniform2f(us("uSize"), simW, simH);
      gl.uniform1f(us("uDt"), dt);
      gl.uniform1f(us("uTime"), time);
      gl.uniform1f(us("uFade"), 0.22 / Math.max(o.persistence, 0.05));
      gl.uniform1f(us("uRadius"), o.radius * o.scale);
      gl.uniform1f(us("uAspect"), simW / simH);
      gl.uniform1f(us("uScale"), o.scale);
      gl.uniform2f(us("uSplat"), sx, sy);
      gl.uniform2f(us("uForce"), fx, fy);
      gl.uniform1f(us("uSplatOn"), on);
      gl.uniform1f(us("uHue"), (time * 0.07) % 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      cur = 1 - cur;
    };
    const render = () => {
      const c = live.current.rgb;
      if (!c) return;
      gl.useProgram(show);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindTexture(gl.TEXTURE_2D, targets[cur].tex);
      gl.uniform1i(ud("uState"), 0);
      gl.uniform2f(ud("uView"), canvas.width, canvas.height);
      gl.uniform3fv(ud("uC0"), c[0]);
      gl.uniform3fv(ud("uC1"), c[1]);
      gl.uniform3fv(ud("uC2"), c[2]);
      gl.uniform3fv(ud("uBg"), c[3]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    let frame = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      frame = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      resize();
      step(dt * live.current.speed);
      render();
    };
    let sizeWatch: ResizeObserver | undefined;
    if (reduced) {
      // Still frame: run the auto stirrer for a few seconds, then draw once (again on resize).
      const still = () => {
        resize();
        for (let i = 0; i < 240; i++) step(1 / 60);
        render();
      };
      sizeWatch = new ResizeObserver(still);
      sizeWatch.observe(canvas);
    } else frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      sizeWatch?.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      for (const t of targets) (gl.deleteTexture(t.tex), gl.deleteFramebuffer(t.fbo));
      gl.deleteProgram(sim);
      gl.deleteProgram(show);
      gl.deleteBuffer(buffer);
    };
    // rgb in the deps so the reduced-motion still frame repaints on a theme change.
  }, [interactive, reduced, reduced ? rgb : null]);

  return <canvas ref={ref} aria-hidden="true" className={cn("pointer-events-none block size-full", className)} style={style} />;
}
