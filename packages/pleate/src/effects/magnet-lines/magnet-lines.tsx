// MagnetLines: a grid of short lines that all turn to point at the cursor like compass needles. Without a pointer
// they follow a point circling slowly around the center. Canvas 2D on CanvasBackground: fills its parent,
// decorative, pauses off screen, one still frame for reduced motion.
"use client";

import { CanvasBackground, rgba, type BackgroundProps, type CanvasFrame } from "../background-kit/background-kit.tsx";

export type MagnetLinesProps = BackgroundProps & {
  /** Distance between lines in px (multiplied by scale). */
  spacing?: number;
  /** Line length in px (multiplied by scale). */
  length?: number;
  /** Line width in px. */
  thickness?: number;
};

/** Colors: lines near and far from the target (default: accent and muted foreground). */
export function MagnetLines({ spacing = 34, length = 16, thickness = 2, ...props }: MagnetLinesProps) {
  const draw = ({ ctx, width, height, time, pointer, colors, scale }: CanvasFrame) => {
    const gap = spacing * scale;
    const half = (length * scale) / 2;
    const cols = Math.ceil(width / gap), rows = Math.ceil(height / gap);
    const ox = (width - (cols - 1) * gap) / 2, oy = (height - (rows - 1) * gap) / 2;
    const r = Math.min(width, height) * 0.3;
    const a = pointer.active;
    const tx = (width / 2 + Math.cos(time * 0.5) * r) * (1 - a) + pointer.x * a;
    const ty = (height / 2 + Math.sin(time * 0.5) * r) * (1 - a) + pointer.y * a;
    const reach = Math.hypot(width, height) * 0.5;
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";
    // Two passes, near then far, so each pass is one stroke.
    for (const near of [true, false]) {
      ctx.beginPath();
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = ox + i * gap, y = oy + j * gap;
          const dist = Math.hypot(tx - x, ty - y);
          if (dist < reach * 0.45 !== near) continue;
          const ang = Math.atan2(ty - y, tx - x);
          const dx = Math.cos(ang) * half, dy = Math.sin(ang) * half;
          ctx.moveTo(x - dx, y - dy);
          ctx.lineTo(x + dx, y + dy);
        }
      }
      ctx.strokeStyle = near ? rgba(colors[0]) : rgba(colors[1], 0.7);
      ctx.stroke();
    }
  };
  return <CanvasBackground {...props} defaults={["var(--pl-accent)", "var(--pl-fg-subtle)"]} draw={draw} />;
}
