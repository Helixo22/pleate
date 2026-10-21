// LogoMarquee: an endless row (logos, partner names, small cards) drifting sideways, fading out at the edges.
// Pauses on hover and focus; with reduced motion it becomes a static, wrapping row. The repeated copies are
// hidden from assistive tech.
import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export type LogoMarqueeProps = {
  children: ReactNode;
  /** Seconds per loop. */
  duration?: number;
  reverse?: boolean;
  gap?: string;
  /** Fade the edges into the background. */
  fade?: boolean;
  label?: string;
  className?: string;
};

export function LogoMarquee({ children, duration = 30, reverse = false, gap = "3rem", fade = true, label, className }: LogoMarqueeProps) {
  const row = "flex shrink-0 items-center justify-around gap-(--pl-marquee-gap) pe-(--pl-marquee-gap)";
  return (
    <div
      role={label ? "region" : undefined}
      aria-label={label}
      className={cn(
        "group flex overflow-hidden [contain:inline-size]",
        fade && "[mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]",
        "motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:[mask-image:none]",
        className,
      )}
      style={{ "--pl-marquee-gap": gap, "--pl-marquee-duration": `${duration}s` } as CSSProperties}
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1 || undefined}
          className={cn(
            row,
            "motion-safe:animate-[pl-marquee_var(--pl-marquee-duration)_linear_infinite] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]",
            reverse && "[animation-direction:reverse]",
            copy === 1 && "motion-reduce:hidden",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
