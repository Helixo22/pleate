// Spinner: the iOS activity indicator (8 fading spokes) in currentColor. Announces itself as a status with a label.
import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";

const SIZES = { xs: 14, sm: 16, md: 20, lg: 28, xl: 40 } as const;
const SPOKES = 8;

export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  size?: keyof typeof SIZES | number;
  /** Accessible name; set `label={null}` when a parent already announces the busy state. */
  label?: string | null;
};

export function Spinner({ size = "md", label = "Loading", className, style, ...props }: SpinnerProps) {
  const px = typeof size === "number" ? size : SIZES[size];
  return (
    <span
      {...(label ? { role: "status", "aria-label": label } : { "aria-hidden": true })}
      className={cn("relative inline-block shrink-0 text-current", className)}
      style={{ width: px, height: px, ...style }}
      {...props}
    >
      {Array.from({ length: SPOKES }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 left-[45.5%] h-[29%] w-[9%] rounded-full bg-current opacity-20"
          style={
            {
              transform: `rotate(${(i * 360) / SPOKES}deg)`,
              transformOrigin: "50% 172%",
              animation: `pl-spoke 0.8s linear ${((i - SPOKES) * 0.8) / SPOKES}s infinite`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
