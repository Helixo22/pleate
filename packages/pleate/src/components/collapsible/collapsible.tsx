// Collapsible: one region that shows and hides (Radix Collapsible), e.g. "Show 3 more stops". The content animates its
// height with the same utility as Accordion; use Accordion when you have a list of sections. Controlled (open +
// onOpenChange) or uncontrolled (defaultOpen). The trigger is unstyled, so pass a Button, a link or your own row
// with `asChild`.
"use client";

import { Collapsible as Primitive } from "radix-ui";
import type { ComponentProps } from "react";

export const Collapsible = Primitive.Root;
export const CollapsibleTrigger = Primitive.Trigger;

export function CollapsibleContent({ className, ...props }: ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Content className={["pl-collapsible", className].filter(Boolean).join(" ")} {...props} />;
}
