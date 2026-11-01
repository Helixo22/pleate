// GridDistortion: an image (or, by default, a palette gradient with a grid) cut into square cells that the pointer
// drags around as it moves; the cells slide back into place when it stops. Canvas 2D on CanvasBackground: fills its
// parent, decorative, pauses off screen, one still frame for reduced motion.
"use client";

import { useEffect, useState } from "react";
import { CanvasBackground, rgba, type BackgroundProps, type CanvasFrame } from "../background-kit/background-kit.tsx";

export type GridDistortionProps = BackgroundProps & {
  /** Image URL to distort, drawn to cover. Without it a palette gradient with a grid is used. */
  src?: string;
  /** Cells along the short side. */
  grid?: number;
  /** How far the cells follow the pointer. */
  strength?: number;
  /** Pointer reach as a share of the short side. */
  radius?: number;
  /** How fast cells settle back, 0 (never) to 1 (at once). */
  relaxation?: number;
};

type State = { cols: number; rows: number; ox: Float32Array; oy: Float32Array; px: number; py: number; source?: HTMLCanvasElement; key?: string };

function paint(width: number, height: number, frame: CanvasFrame, image: HTMLImageElement | null) {
  const c = document.createElement("canvas");
  c.width = Math.round(width);
  c.height = Math.round(height);
  const g = c.getContext("2d")!;
  if (image) {
    const s = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const w = image.naturalWidth * s, h = image.naturalHeight * s;
    g.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
    return c;
  }
  const [a, b, d] = frame.colors;
  const lin = g.createLinearGradient(0, 0, width, height);
  lin.addColorStop(0, rgba(a));
  lin.addColorStop(0.55, rgba(b));
  lin.addColorStop(1, rgba(d));
  g.fillStyle = lin;
  g.fillRect(0, 0, width, height);
  for (const [x, y, r] of [[0.25, 0.3, 0.35], [0.75, 0.7, 0.4]]) {
    const rad = g.createRadialGradient(x * width, y * height, 0, x * width, y * height, r * Math.max(width, height));
    rad.addColorStop(0, rgba(a, 0.7));
    rad.addColorStop(1, rgba(a, 0));
    g.fillStyle = rad;
    g.fillRect(0, 0, width, height);
  }
  g.strokeStyle = "rgba(255,255,255,0.18)";
  g.lineWidth = 1;
  const step = Math.min(width, height) / 8;
  g.beginPath();
  for (let x = step; x < width; x += step) (g.moveTo(Math.round(x) + 0.5, 0), g.lineTo(Math.round(x) + 0.5, height));
  for (let y = step; y < height; y += step) (g.moveTo(0, Math.round(y) + 0.5), g.lineTo(width, Math.round(y) + 0.5));
  g.stroke();
  return c;
}

/** Colors: the default gradient's light, mid and deep stops (default: accent ramp). Unused with `src`. */
export function GridDistortion({ src, grid = 12, strength = 0.15, radius = 0.25, relaxation = 0.9, ...props }: GridDistortionProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) return setImage(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.src = src;
  }, [src]);

  const draw = (frame: CanvasFrame) => {
    const { ctx, width, height, dt, pointer, colors, store } = frame;
    const cell = Math.min(width, height) / Math.max(2, grid);
    let s = store.state as State | undefined;
    if (!s) {
      const cols = Math.ceil(width / cell), rows = Math.ceil(height / cell);
      s = { cols, rows, ox: new Float32Array(cols * rows), oy: new Float32Array(cols * rows), px: pointer.x, py: pointer.y };
      store.state = s;
    }
    const key = `${src ?? ""}|${image ? 1 : 0}|${colors.flat().join()}`;
    if (!s.source || s.key !== key) {
      s.source = paint(width, height, frame, src ? image : null);
      s.key = key;
    }
    const vx = pointer.x - s.px, vy = pointer.y - s.py;
    s.px = pointer.x;
    s.py = pointer.y;
    const reach = radius * Math.min(width, height);
    const settle = Math.pow(1 - Math.min(Math.max(relaxation, 0), 1) * 0.12, dt * 60);
    for (let j = 0; j < s.rows; j++) {
      for (let i = 0; i < s.cols; i++) {
        const k = j * s.cols + i;
        const d = Math.hypot((i + 0.5) * cell - pointer.x, (j + 0.5) * cell - pointer.y);
        const pull = pointer.active * Math.max(0, 1 - d / reach) * strength * 10;
        s.ox[k] = s.ox[k] * settle + vx * pull;
        s.oy[k] = s.oy[k] * settle + vy * pull;
        // Draw the cell from its displaced source spot, clamped inside the source.
        const sx = Math.min(Math.max(i * cell - s.ox[k], 0), width - cell);
        const sy = Math.min(Math.max(j * cell - s.oy[k], 0), height - cell);
        ctx.drawImage(s.source, sx, sy, cell, cell, i * cell, j * cell, cell + 0.5, cell + 0.5);
      }
    }
  };
  return <CanvasBackground {...props} defaults={["var(--pl-accent-300)", "var(--pl-accent)", "var(--pl-accent-900)"]} draw={draw} />;
}
