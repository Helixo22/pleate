// MorphSlider: an image slider that melts from one picture to the next. A WebGL2 shader pushes both images along a
// noise field while it blends them, so the old one smears into the new one. Prev / next buttons, dots and arrow
// keys drive it. Without WebGL2, or with reduced motion, it falls back to a plain crossfade of <img>s.
// Images must allow CORS (crossOrigin="anonymous") to be used as textures.
"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronRightIcon } from "../../lib/icons.tsx";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type MorphSlide = { src: string; alt: string };

export type MorphSliderProps = {
  slides: MorphSlide[];
  /** Transition length (ms). */
  duration?: number;
  /** How far the melt pushes pixels (0 to 1). */
  strength?: number;
  /** Advance on its own every N ms (0 = off). Pauses on hover and focus. */
  autoplay?: number;
  className?: string;
};

const VERT = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; vUv.y = 1.0 - vUv.y; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 fragColor;
uniform sampler2D uA, uB; uniform vec2 uScaleA, uScaleB; uniform float uP, uStrength;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
vec2 cover(vec2 uv, vec2 s) { return (uv - 0.5) * s + 0.5; }
void main() {
  float field = n(vUv * 3.0) * 0.7 + n(vUv * 7.0) * 0.3;
  vec2 dir = vec2(cos(field * 6.283), sin(field * 6.283));
  float p = smoothstep(0.0, 1.0, uP);
  vec4 a = texture(uA, cover(vUv + dir * p * uStrength, uScaleA));
  vec4 b = texture(uB, cover(vUv - dir * (1.0 - p) * uStrength, uScaleB));
  float edge = smoothstep(field - 0.25, field + 0.25, p * 1.5 - 0.25);
  fragColor = mix(a, b, edge);
}`;

type Tex = { tex: WebGLTexture; aspect: number };

export function MorphSlider({ slides, duration = 1200, strength = 0.2, autoplay = 0, className }: MorphSliderProps) {
  const reduced = useReducedMotion();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [index, setIndex] = useState(0);
  const [gl, setGl] = useState(false);
  const paused = useRef(false);
  const api = useRef<{ go: (from: number, to: number) => void } | null>(null);
  const shown = useRef(0);

  useEffect(() => {
    const el = canvas.current;
    const ctx = !reduced && el ? el.getContext("webgl2", { premultipliedAlpha: false }) : null;
    if (!el || !ctx) return setGl(false);
    const g = ctx;
    const prog = g.createProgram()!;
    for (const [type, src] of [[g.VERTEX_SHADER, VERT], [g.FRAGMENT_SHADER, FRAG]] as const) {
      const sh = g.createShader(type)!;
      g.shaderSource(sh, src);
      g.compileShader(sh);
      g.attachShader(prog, sh);
    }
    g.linkProgram(prog);
    if (!g.getProgramParameter(prog, g.LINK_STATUS)) return setGl(false);
    g.useProgram(prog);
    g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
    const loc = g.getAttribLocation(prog, "aPos");
    g.enableVertexAttribArray(loc);
    g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    const u = (name: string) => g.getUniformLocation(prog, name);
    g.uniform1i(u("uA"), 0);
    g.uniform1i(u("uB"), 1);
    g.uniform1f(u("uStrength"), strength);
    const textures: (Tex | undefined)[] = [];
    let raf = 0;
    let disposed = false;
    let state = { from: 0, to: 0, p: 0 };

    const scale = (aspect: number) => {
      const c = el.width / el.height;
      return c > aspect ? [1, aspect / c] : [c / aspect, 1];
    };
    const draw = () => {
      const a = textures[state.from], b = textures[state.to] ?? a;
      if (!a || !b) return;
      g.viewport(0, 0, el.width, el.height);
      g.activeTexture(g.TEXTURE0);
      g.bindTexture(g.TEXTURE_2D, a.tex);
      g.activeTexture(g.TEXTURE1);
      g.bindTexture(g.TEXTURE_2D, b.tex);
      g.uniform2fv(u("uScaleA"), scale(a.aspect));
      g.uniform2fv(u("uScaleB"), scale(b.aspect));
      g.uniform1f(u("uP"), state.p);
      g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    };
    slides.forEach((s, i) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (disposed) return;
        const tex = g.createTexture()!;
        g.bindTexture(g.TEXTURE_2D, tex);
        g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
        for (const w of [g.TEXTURE_WRAP_S, g.TEXTURE_WRAP_T]) g.texParameteri(g.TEXTURE_2D, w, g.MIRRORED_REPEAT);
        textures[i] = { tex, aspect: img.naturalWidth / img.naturalHeight };
        if (i === shown.current) {
          state = { from: i, to: i, p: 0 };
          draw();
          setGl(true);
        }
      };
      img.src = s.src;
    });
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(2, devicePixelRatio);
      el.width = Math.round(el.clientWidth * dpr);
      el.height = Math.round(el.clientHeight * dpr);
      draw();
    });
    ro.observe(el);
    api.current = {
      go(from, to) {
        cancelAnimationFrame(raf);
        if (!textures[to]) return void (state = { from: to, to, p: 0 });
        state = { from, to, p: 0 };
        const start = performance.now();
        const tick = (now: number) => {
          state.p = Math.min(1, (now - start) / duration);
          draw();
          if (state.p < 1) raf = requestAnimationFrame(tick);
          else (state = { from: to, to, p: 0 });
        };
        raf = requestAnimationFrame(tick);
      },
    };
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      api.current = null;
      disposed = true;
      // No loseContext(): the same canvas hands back the same context on remount (React strict mode).
    };
  }, [slides, duration, strength, reduced]);

  const go = (next: number) => {
    const to = (next + slides.length) % slides.length;
    api.current?.go(shown.current, to);
    shown.current = to;
    setIndex(to);
  };

  useEffect(() => {
    if (!autoplay || reduced) return;
    const t = setInterval(() => !paused.current && go(shown.current + 1), autoplay);
    return () => clearInterval(t);
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(index + 1);
    else if (e.key === "ArrowLeft") go(index - 1);
  };

  const btn = "pl-focus-ring pl-touch grid size-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50 [&_svg]:size-5";
  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Image slider"
      onKeyDown={onKeyDown}
      onPointerEnter={() => (paused.current = true)}
      onPointerLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
      className={cn("relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-fill", className)}
    >
      {slides.map((s, i) => (
        <img
          key={s.src}
          src={s.src}
          alt={s.alt}
          aria-hidden={i !== index}
          className={cn("absolute inset-0 size-full object-cover transition-opacity duration-500", i === index && !gl ? "opacity-100" : "opacity-0")}
        />
      ))}
      <canvas ref={canvas} aria-hidden="true" className={cn("absolute inset-0 size-full", !gl && "invisible")} />
      <p className="sr-only" aria-live="polite">{`Slide ${index + 1} of ${slides.length}: ${slides[index]?.alt}`}</p>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
        <button type="button" aria-label="Previous slide" onClick={() => go(index - 1)} className={btn}>
          <ChevronRightIcon className="rotate-180" />
        </button>
        <div className="flex gap-1.5 rounded-full bg-black/35 px-3 py-2 backdrop-blur-md">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => i !== index && go(i)}
              className={cn("pl-focus-ring h-2 rounded-full transition-all", i === index ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/80")}
            />
          ))}
        </div>
        <button type="button" aria-label="Next slide" onClick={() => go(index + 1)} className={btn}>
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}
