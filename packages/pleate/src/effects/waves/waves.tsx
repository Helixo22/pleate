// Waves: a curtain of vertical lines swaying on layered sine waves. The pointer pushes the lines aside as it passes.
// Decorative: fills its parent (use `absolute inset-0` behind content), pauses off screen, a still frame for reduced motion.
// Inspired by React Bits (waves); own canvas 2D code.
"use client";

import { CanvasBackground, rgba, type BackgroundProps, type CanvasFrame } from "../background-kit/background-kit.tsx";

/** colors: [lines]. */
export type WavesProps = BackgroundProps & {
  /** Space between lines in px (times scale). */
  gap?: number;
  /** How far the lines sway in px. */
  amplitude?: number;
};

export function Waves({ gap = 14, amplitude = 26, ...props }: WavesProps) {
  const draw = ({ ctx, width, height, time, pointer, colors: [line], scale }: CanvasFrame) => {
    const step = gap * scale, reach = 120 * scale;
    ctx.strokeStyle = rgba(line, 0.32);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x0 = -step; x0 < width + step; x0 += step) {
      for (let y = -10; y <= height + 10; y += 8) {
        let x = x0 + amplitude * (Math.sin(y * 0.006 + time * 0.8 + x0 * 0.004) * 0.6 + Math.sin(y * 0.013 - time * 1.1 + x0 * 0.011) * 0.4);
        const dx = x - pointer.x, dy = y - pointer.y;
        const f = pointer.active * Math.exp(-(dx * dx + dy * dy) / (reach * reach));
        x += dx * f * 0.8;
        if (y === -10) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  };
  return <CanvasBackground defaults={["var(--pl-fg)"]} draw={draw} {...props} />;
}
