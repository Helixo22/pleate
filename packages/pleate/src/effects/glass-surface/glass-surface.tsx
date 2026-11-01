// GlassSurface: a frosted "liquid glass" panel. Everything behind it is blurred and saturated, the rim catches light,
// and on Chromium an SVG displacement map bends the backdrop near the edges like a thick lens. Other browsers get
// the frosted glass without the bend.
"use client";

import { useEffect, useId, useRef, useState, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";

export type GlassSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  /** Backdrop blur (px). */
  blur?: number;
  /** Backdrop saturation (1 = unchanged). */
  saturation?: number;
  /** Edge bend strength (px). 0 turns the lens off. */
  refraction?: number;
  /** Glass tint (CSS color). */
  tint?: string;
};

// Red encodes x, blue encodes y; the gray center (128) means no shift, so only the rim bends.
const MAP = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="r"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#f00"/></linearGradient><linearGradient id="b" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#00f"/></linearGradient><filter id="f"><feGaussianBlur stdDeviation="5"/></filter></defs><rect width="100" height="100" fill="url(#r)"/><rect width="100" height="100" fill="url(#b)" style="mix-blend-mode:screen"/><rect x="12" y="12" width="76" height="76" rx="10" fill="#808080" filter="url(#f)"/></svg>`,
)}`;

export function GlassSurface({ blur = 14, saturation = 1.8, refraction = 40, tint = "color-mix(in oklab, var(--pl-surface) 35%, transparent)", className, style, children, ...props }: GlassSurfaceProps) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number] | null>(null);
  const [lens, setLens] = useState(false);
  useEffect(() => {
    // shortcut: backdrop-filter url() only renders in Chromium; sniff it until a feature test exists.
    setLens(refraction > 0 && /Chrome\//.test(navigator.userAgent));
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize([e.contentRect.width, e.contentRect.height]));
    ro.observe(el);
    return () => ro.disconnect();
  }, [refraction]);
  const base = `blur(${blur}px) saturate(${saturation})`;
  const filter = lens && size ? `url(#${id}) ${base}` : base;
  return (
    <div
      ref={ref}
      className={cn("relative isolate rounded-3xl", className)}
      style={{
        background: tint,
        backdropFilter: filter,
        WebkitBackdropFilter: base,
        boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.45), inset 0 0 0 1px rgb(255 255 255 / 0.16), inset 0 -12px 24px -14px rgb(255 255 255 / 0.25), var(--pl-shadow-lg)",
        ...style,
      }}
      {...props}
    >
      {lens && size && (
        <svg aria-hidden="true" width="0" height="0" className="absolute">
          <filter id={id} x="0" y="0" width={size[0]} height={size[1]} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={MAP} x="0" y="0" width={size[0]} height={size[1]} preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={refraction} xChannelSelector="R" yChannelSelector="B" />
          </filter>
        </svg>
      )}
      {children}
    </div>
  );
}
