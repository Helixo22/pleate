// Skeleton: shimmering placeholders while content loads, blocks, circles and lines of text. Decorative: mark the
// loading region with aria-busy="true" (and a visually hidden "Loading…") on its container.
import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  shape?: "rect" | "circle" | "text";
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
};

export function Skeleton({ className, shape = "rect", width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pl-skeleton shrink-0",
        shape === "circle" && "aspect-square rounded-full",
        shape === "rect" && "rounded-lg",
        shape === "text" && "h-[0.8em] rounded-full",
        className,
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

export type SkeletonTextProps = HTMLAttributes<HTMLDivElement> & {
  lines?: number;
  /** Width of the last line (shorter, like real text). */
  lastLineWidth?: string;
};

export function SkeletonText({ className, lines = 3, lastLineWidth = "60%", ...props }: SkeletonTextProps) {
  return (
    <div aria-hidden="true" className={cn("flex w-full flex-col gap-[0.6em] text-body", className)} {...props}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} shape="text" width={i === lines - 1 && lines > 1 ? lastLineWidth : "100%"} />
      ))}
    </div>
  );
}
