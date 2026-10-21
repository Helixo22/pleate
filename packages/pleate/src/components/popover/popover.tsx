// Popover: rich, interactive content anchored to a trigger (filters, a color picker, a short form). Rounded raised
// card that grows from its trigger, optional arrow. Radix Popover: focus moves in, Escape and outside click close it.
"use client";

import { Popover as Primitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export const Popover = Primitive.Root;
export const PopoverTrigger = Primitive.Trigger;
export const PopoverAnchor = Primitive.Anchor;
export const PopoverClose = Primitive.Close;

export type PopoverContentProps = ComponentProps<typeof Primitive.Content> & { arrow?: boolean };

export function PopoverContent({ className, sideOffset = 8, collisionPadding = 8, align = "center", arrow = false, children, ...props }: PopoverContentProps) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        align={align}
        className={cn(
          "pl-pop z-(--pl-z-dropdown) w-72 max-w-[calc(100vw-1rem)] rounded-2xl bg-elevated p-4 text-fg shadow-xl outline-none",
          "[--radix-popper-transform-origin:var(--radix-popover-content-transform-origin)]",
          className,
        )}
        {...props}
      >
        {children}
        {arrow && <Primitive.Arrow width={18} height={8} className="fill-(--pl-elevated)" />}
      </Primitive.Content>
    </Primitive.Portal>
  );
}
