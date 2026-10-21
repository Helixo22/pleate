// GradientText: text filled with a slowly drifting gradient. By default it walks the palette's accent scale, so it
// changes with the theme; pass your own colors for anything else.
import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export type GradientTextProps = {
  children: ReactNode;
  as?: ElementType;
  colors?: string[];
  /** Seconds per loop; 0 for a still gradient. */
  speed?: number;
  className?: string;
};

const DEFAULT = ["var(--pl-accent-400)", "var(--pl-accent-600)", "var(--pl-accent-300)", "var(--pl-accent-700)", "var(--pl-accent-400)"];

export function GradientText({ children, as: Tag = "span", colors = DEFAULT, speed = 6, className }: GradientTextProps) {
  return (
    <Tag
      className={cn(
        "inline-block bg-[length:300%_100%] bg-clip-text text-transparent",
        speed > 0 && "motion-safe:animate-[pl-gradient_var(--pl-gradient-speed)_ease-in-out_infinite_alternate]",
        className,
      )}
      style={{ "--pl-gradient-speed": `${speed}s`, backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
