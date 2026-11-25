// The parts that need no browser code, so they also render in Server Components.
// - PixelArt: a drawing as a crisp SVG vector. It scales to any size and can use theme colors.
// - PixelFrame: stepped corners and a hard offset shadow around anything, like a pleate Button or Card.
import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { bufferToPaths, PixelBuffer, renderDrawing, type PixelDrawing, type PixelPath } from "./buffer.ts";

/* ------------------------------------------------------------------------------------------------ PixelArt */

export type PixelArtProps = {
  art: Pick<PixelDrawing, "size" | "draw"> | PixelBuffer;
  /** Accessible name. Without it the drawing is decorative. */
  label?: string;
  /** Swaps colors of the drawing: { "#d33a2c": "var(--pl-accent)" }. */
  colors?: Record<string, string>;
  className?: string;
  style?: CSSProperties;
};

// A drawing never changes, so it is drawn and merged once however many times it is shown. Buffers are drawn on by
// their owner and are merged again each time.
const vectors = new WeakMap<object, { width: number; height: number; paths: PixelPath[] }>();

function vector(art: PixelArtProps["art"]) {
  if (art instanceof PixelBuffer) return { width: art.width, height: art.height, paths: bufferToPaths(art) };
  let known = vectors.get(art);
  if (!known) {
    const buffer = renderDrawing(art);
    vectors.set(art, (known = { width: buffer.width, height: buffer.height, paths: bufferToPaths(buffer) }));
  }
  return known;
}

export function PixelArt({ art, label, colors, className, style }: PixelArtProps) {
  const { width, height, paths } = vector(art);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("block size-full", className)}
      style={style}
    >
      {paths.map(({ color, d }) => (
        <path key={color} d={d} style={{ fill: colors?.[color] ?? color }} />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------------------------------------ PixelFrame */

export type PixelFrameProps = {
  children: ReactNode;
  /** Width in px of the border and of one corner step. */
  step?: number;
  /** Hard shadow, in px, to the bottom right. 0 removes it. */
  shadow?: number;
  /** Color of the border and the shadow. */
  color?: string;
  className?: string;
};

export function PixelFrame({ children, step = 2, shadow = 4, color = "var(--pl-fg)", className }: PixelFrameProps) {
  const s = `${step}px`;
  const outer = `polygon(${s} 0, calc(100% - ${s}) 0, calc(100% - ${s}) ${s}, 100% ${s}, 100% calc(100% - ${s}), calc(100% - ${s}) calc(100% - ${s}), calc(100% - ${s}) 100%, ${s} 100%, ${s} calc(100% - ${s}), 0 calc(100% - ${s}), 0 ${s}, ${s} ${s})`;
  return (
    <span className={cn("relative inline-block [&:has(:focus-visible)]:outline-2 [&:has(:focus-visible)]:outline-offset-4 [&:has(:focus-visible)]:outline-accent", className)}>
      {shadow > 0 && <span aria-hidden className="absolute inset-0" style={{ clipPath: outer, background: color, transform: `translate(${shadow}px, ${shadow}px)` }} />}
      <span className="relative block transition-transform duration-100 motion-reduce:transition-none [&:has(:active)]:translate-0.5" style={{ clipPath: outer, background: color, padding: s }}>
        <span className="block *:w-full *:rounded-none" style={{ clipPath: outer }}>
          {children}
        </span>
      </span>
    </span>
  );
}
