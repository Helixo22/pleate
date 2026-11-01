// GlitchText: two offset copies of the text in split colors flicker through random horizontal slices, like a bad
// signal. The copies are aria-hidden; the real text stays underneath. Reduced motion hides the copies.
import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export type GlitchTextProps = {
  children: ReactNode;
  as?: ElementType;
  /** Seconds per glitch cycle; lower is more frantic. */
  speed?: number;
  /** Only glitch while hovered or focused. */
  onHover?: boolean;
  /** Pixels the copies are shifted sideways. */
  offset?: number;
  /** Colors of the two copies (CSS). */
  colors?: [string, string];
  className?: string;
};

const CSS = `
@keyframes pl-glitch-slice {
  0% { clip-path: inset(12% 0 70% 0); } 10% { clip-path: inset(60% 0 8% 0); } 20% { clip-path: inset(32% 0 52% 0); }
  30% { clip-path: inset(84% 0 2% 0); } 40% { clip-path: inset(4% 0 86% 0); } 50% { clip-path: inset(46% 0 38% 0); }
  60% { clip-path: inset(70% 0 18% 0); } 70% { clip-path: inset(20% 0 64% 0); } 80% { clip-path: inset(54% 0 30% 0); }
  90% { clip-path: inset(8% 0 78% 0); } 100% { clip-path: inset(40% 0 44% 0); }
}
.pl-glitch-layer { position: absolute; inset: 0; pointer-events: none; clip-path: inset(0 0 100% 0);
  animation: pl-glitch-slice var(--pl-glitch-speed) steps(1) infinite alternate; }
.pl-glitch-layer:last-child { animation-direction: alternate-reverse; animation-duration: calc(var(--pl-glitch-speed) * 1.3); }
.pl-glitch[data-hover] .pl-glitch-layer { animation-play-state: paused; visibility: hidden; }
.pl-glitch[data-hover]:hover .pl-glitch-layer, .pl-glitch[data-hover]:focus-within .pl-glitch-layer { animation-play-state: running; visibility: visible; }
@media (prefers-reduced-motion: reduce) { .pl-glitch .pl-glitch-layer { display: none; } }
html[data-motion="off"] .pl-glitch .pl-glitch-layer { display: none; }
`;

export function GlitchText({
  children,
  as: Tag = "span",
  speed = 0.5,
  onHover = false,
  offset = 3,
  colors = ["var(--pl-accent)", "#ff3b6b"],
  className,
}: GlitchTextProps) {
  return (
    <Tag
      data-hover={onHover ? "" : undefined}
      className={cn("pl-glitch relative inline-block", className)}
      style={{ "--pl-glitch-speed": `${speed}s` } as CSSProperties}
    >
      <style href="pl-glitch-text" precedence="pleate">
        {CSS}
      </style>
      {children}
      <span aria-hidden="true" className="pl-glitch-layer" style={{ color: colors[0], transform: `translateX(-${offset}px)` }}>
        {children}
      </span>
      <span aria-hidden="true" className="pl-glitch-layer" style={{ color: colors[1], transform: `translateX(${offset}px)` }}>
        {children}
      </span>
    </Tag>
  );
}
