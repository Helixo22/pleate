// ShinyText: a band of light sweeping across the text, in the current text color — for labels that should catch
// the eye without moving.
import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export type ShinyTextProps = {
  children: ReactNode;
  as?: ElementType;
  /** Seconds per sweep. */
  speed?: number;
  /** Base and highlight colors (CSS); default muted text and full text color. */
  base?: string;
  shine?: string;
  className?: string;
};

export function ShinyText({ children, as: Tag = "span", speed = 2.4, base = "var(--pl-fg-muted)", shine = "var(--pl-fg)", className }: ShinyTextProps) {
  return (
    <Tag
      className={cn(
        "inline-block bg-[length:250%_100%] bg-clip-text text-transparent motion-safe:animate-[pl-shine_var(--pl-shine-speed)_linear_infinite]",
        className,
      )}
      style={
        {
          "--pl-shine-speed": `${speed}s`,
          backgroundImage: `linear-gradient(110deg, ${base} 0%, ${base} 40%, ${shine} 50%, ${base} 60%, ${base} 100%)`,
        } as CSSProperties
      }
    >
      {children}
    </Tag>
  );
}
