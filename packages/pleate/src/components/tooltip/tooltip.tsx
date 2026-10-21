// Tooltip: a short label on hover or keyboard focus — for icon buttons and truncated text, never for essential
// information (touch screens rarely show it). <Tooltip content="…"> wraps one focusable child; compose the parts
// for more control, inside a single <TooltipProvider> so moving between tooltips skips the delay.
"use client";

import { Tooltip as Primitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export const TooltipProvider = ({ delayDuration = 400, ...props }: ComponentProps<typeof Primitive.Provider>) => (
  <Primitive.Provider delayDuration={delayDuration} {...props} />
);
export const TooltipRoot = Primitive.Root;
export const TooltipTrigger = Primitive.Trigger;

export function TooltipContent({ className, sideOffset = 6, collisionPadding = 8, children, ...props }: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "pl-pop z-(--pl-z-tooltip) max-w-64 rounded-lg bg-fg px-2.5 py-1.5 text-footnote font-medium text-bg shadow-md select-none",
          "[--radix-popper-transform-origin:var(--radix-tooltip-content-transform-origin)]",
          className,
        )}
        {...props}
      >
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  /** Keep the tooltip closed (e.g. when the label is already visible). */
  disabled?: boolean;
};

export function Tooltip({ content, children, side = "top", align = "center", delayDuration = 400, disabled }: TooltipProps) {
  if (disabled) return <>{children}</>;
  return (
    <Primitive.Provider delayDuration={delayDuration}>
      <Primitive.Root>
        <Primitive.Trigger asChild>{children}</Primitive.Trigger>
        <TooltipContent side={side} align={align}>
          {content}
        </TooltipContent>
      </Primitive.Root>
    </Primitive.Provider>
  );
}
