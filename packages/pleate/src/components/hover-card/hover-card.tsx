// HoverCard: a preview that opens when a pointer rests on a link (a traveller's profile, a place, a booking). Looks
// like Popover. Hover and keyboard focus open it; touch screens never do, so keep the trigger useful on its own.
"use client";

import { HoverCard as Primitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

export function HoverCard({ openDelay = 400, closeDelay = 150, ...props }: ComponentProps<typeof Primitive.Root>) {
  return <Primitive.Root openDelay={openDelay} closeDelay={closeDelay} {...props} />;
}
export const HoverCardTrigger = Primitive.Trigger;

export type HoverCardContentProps = ComponentProps<typeof Primitive.Content> & { arrow?: boolean };

export function HoverCardContent({ className, sideOffset = 8, collisionPadding = 8, align = "center", arrow = false, children, ...props }: HoverCardContentProps) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        align={align}
        className={cn(
          "pl-pop z-(--pl-z-dropdown) w-72 max-w-[calc(100vw-1rem)] rounded-lg bg-elevated p-3 text-fg shadow-lg outline-none",
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
