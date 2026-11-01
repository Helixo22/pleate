// GradualBlur: content blurs progressively toward one edge, like a frosted fade. Stacked backdrop-filter layers,
// each masked to its own band, so the blur grows smoothly. Put it inside a relative container (or use `fixed` for
// the viewport edge). Static, so nothing to turn off for reduced motion.
import type { CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";

export type GradualBlurProps = {
  /** Which edge gets the blur. */
  position?: "top" | "bottom" | "left" | "right";
  /** Depth of the blurred band (CSS length). */
  size?: string;
  /** Blur at the edge in px. */
  strength?: number;
  /** Number of stacked layers: more is smoother and costlier. */
  layers?: number;
  /** Also fade to the page background at the edge. */
  fade?: boolean;
  /** Pin to the viewport edge instead of the parent. */
  fixed?: boolean;
  className?: string;
};

export function GradualBlur({ position = "bottom", size = "6rem", strength = 12, layers = 5, fade = false, fixed = false, className }: GradualBlurProps) {
  const vertical = position === "top" || position === "bottom";
  // Gradients run from the edge inward.
  const dir = { top: "to top", bottom: "to bottom", left: "to left", right: "to right" }[position];
  const box: CSSProperties = { [position]: 0, [vertical ? "height" : "width"]: size, [vertical ? "left" : "top"]: 0, [vertical ? "right" : "bottom"]: 0 };
  return (
    <div aria-hidden="true" className={cn("pointer-events-none z-10", fixed ? "fixed" : "absolute", className)} style={box}>
      {Array.from({ length: layers }, (_, i) => {
        const step = 100 / layers;
        const a = i * step, b = (i + 1) * step, c = Math.min(100, (i + 2) * step);
        const mask = `linear-gradient(${dir}, transparent ${Math.max(0, a - step)}%, black ${a}%, black ${b}%, transparent ${c}%)`;
        const blur = strength * Math.pow(2, i - layers + 1);
        return <div key={i} className="absolute inset-0" style={{ backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)`, maskImage: mask, WebkitMaskImage: mask }} />;
      })}
      {fade && <div className="absolute inset-0" style={{ background: `linear-gradient(${dir}, transparent, var(--pl-bg))` }} />}
    </div>
  );
}
