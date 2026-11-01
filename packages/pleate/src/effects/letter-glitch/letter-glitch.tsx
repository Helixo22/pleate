// LetterGlitch: a screen full of monospace characters that keep flipping to new glyphs and colors, faster around
// the pointer, with a vignette that fades the edges into the page. Canvas 2D on CanvasBackground: fills its parent,
// decorative, pauses off screen, one still frame for reduced motion.
"use client";

import { CanvasBackground, type BackgroundProps, type CanvasFrame, rgba } from "../background-kit/background-kit.tsx";

export type LetterGlitchProps = BackgroundProps & {
  /** Characters to draw from. */
  characters?: string;
  /** Character size in px (multiplied by scale). */
  fontSize?: number;
  /** Share of glyphs that change every second, 0 to 1. */
  rate?: number;
  /** Fade the edges into the page background. */
  vignette?: boolean;
};

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$&*()-_+=/[]{};:<>,.?";

type Grid = { cols: number; rows: number; glyph: Uint16Array; tint: Uint8Array };

/** Colors: up to three glyph colors, then the vignette color (default: accent ramp and page background). */
export function LetterGlitch({ characters = CHARS, fontSize = 16, rate = 0.6, vignette = true, ...props }: LetterGlitchProps) {
  const draw = ({ ctx, width, height, dt, pointer, colors, scale, store }: CanvasFrame) => {
    const size = fontSize * scale;
    const cw = size * 0.62, ch = size * 1.15;
    const glyphs = characters.length ? characters : CHARS;
    let grid = store.grid as Grid | undefined;
    if (!grid) {
      const cols = Math.ceil(width / cw), rows = Math.ceil(height / ch);
      const n = cols * rows;
      grid = { cols, rows, glyph: new Uint16Array(n), tint: new Uint8Array(n) };
      for (let i = 0; i < n; i++) {
        grid.glyph[i] = Math.floor(Math.random() * glyphs.length);
        grid.tint[i] = Math.floor(Math.random() * 3);
      }
      store.grid = grid;
    }
    const { cols, rows, glyph, tint } = grid;
    const n = cols * rows;
    // Random flips everywhere, plus extra flips within ~6 cells of the pointer.
    let flips = n * rate * dt;
    flips = Math.floor(flips) + (Math.random() < flips % 1 ? 1 : 0);
    for (let k = 0; k < flips; k++) {
      const i = Math.floor(Math.random() * n);
      glyph[i] = Math.floor(Math.random() * glyphs.length);
      tint[i] = Math.floor(Math.random() * 3);
    }
    if (pointer.active > 0.5) {
      const pc = Math.floor(pointer.x / cw), pr = Math.floor(pointer.y / ch);
      for (let k = 0; k < 12; k++) {
        const c = pc + Math.round((Math.random() - 0.5) * 12), r = pr + Math.round((Math.random() - 0.5) * 8);
        if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
        glyph[r * cols + c] = Math.floor(Math.random() * glyphs.length);
        tint[r * cols + c] = Math.floor(Math.random() * 3);
      }
    }
    ctx.font = `${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textBaseline = "top";
    for (let t = 0; t < 3; t++) {
      ctx.fillStyle = rgba(colors[t]);
      for (let i = 0; i < n; i++) {
        if (tint[i] !== t) continue;
        ctx.fillText(glyphs[glyph[i]] ?? "", (i % cols) * cw, Math.floor(i / cols) * ch);
      }
    }
    if (vignette) {
      const g = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.2, width / 2, height / 2, Math.hypot(width, height) / 2);
      g.addColorStop(0, rgba(colors[3], 0));
      g.addColorStop(1, rgba(colors[3], 1));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }
  };
  return <CanvasBackground {...props} defaults={["var(--pl-accent)", "var(--pl-accent-300)", "var(--pl-accent-800)", "var(--pl-bg)"]} draw={draw} />;
}
