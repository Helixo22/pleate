// Accordion: sections that expand in place (Radix Accordion: one or many open, arrow keys between headers).
// "inset" groups them on one rounded panel like an iOS inset grouped list (hairlines inset from the leading edge),
// "separated" gives each its own card, "plain" uses hairlines only. Panels animate their height; the disclosure
// chevron turns down as it opens.
"use client";

import { Accordion as Primitive } from "radix-ui";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronRightIcon } from "../../lib/icons.tsx";

type Variant = "inset" | "separated" | "plain";
const AccordionContext = createContext<Variant>("inset");

export type AccordionProps = ComponentProps<typeof Primitive.Root> & { variant?: Variant };

export function Accordion({ variant = "inset", className, ...props }: AccordionProps) {
  return (
    <AccordionContext.Provider value={variant}>
      <Primitive.Root
        className={cn(
          "flex w-full flex-col",
          variant === "inset" && "overflow-hidden rounded-lg bg-surface shadow-[var(--pl-edge)]",
          variant === "separated" && "gap-2",
          className,
        )}
        {...(props as ComponentProps<typeof Primitive.Root>)}
      />
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ className, ...props }: ComponentProps<typeof Primitive.Item>) {
  const variant = useContext(AccordionContext);
  return (
    <Primitive.Item
      className={cn(
        variant === "inset" && "relative after:absolute after:inset-x-0 after:bottom-0 after:ms-4 after:h-px after:bg-separator last:after:hidden",
        variant === "separated" && "overflow-hidden rounded-lg bg-surface shadow-[var(--pl-edge)]",
        variant === "plain" && "border-b border-separator",
        className,
      )}
      {...props}
    />
  );
}

export type AccordionTriggerProps = ComponentProps<typeof Primitive.Trigger> & { icon?: ReactNode; subtitle?: ReactNode };

export function AccordionTrigger({ className, children, icon, subtitle, ...props }: AccordionTriggerProps) {
  const variant = useContext(AccordionContext);
  return (
    <Primitive.Header className="flex">
      <Primitive.Trigger
        className={cn(
          "group pl-focus-ring pl-touch flex min-h-12 flex-1 cursor-pointer items-center gap-3 py-3 text-start outline-offset-[-2px]",
          variant === "plain" ? "px-0" : "px-4",
          variant !== "plain" && "transition-colors hover:bg-fill-3",
          "[&>svg:first-child]:size-[1.125rem] [&>svg:first-child]:shrink-0 [&>svg:first-child]:text-accent-ink",
          className,
        )}
        {...props}
      >
        {icon}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-body text-fg">{children}</span>
          {subtitle && <span className="text-footnote text-fg-muted">{subtitle}</span>}
        </span>
        <ChevronRightIcon
          className="size-4 shrink-0 text-fg-subtle/70 transition-[rotate] duration-(--pl-duration-base) ease-ios group-data-[state=open]:rotate-90 rtl:rotate-180 rtl:group-data-[state=open]:rotate-90"
          strokeWidth={2.5}
        />
      </Primitive.Trigger>
    </Primitive.Header>
  );
}

export function AccordionContent({ className, children, ...props }: ComponentProps<typeof Primitive.Content>) {
  const variant = useContext(AccordionContext);
  return (
    <Primitive.Content className="pl-collapsible" {...props}>
      <div className={cn("pb-4 text-subhead text-fg-muted", variant === "plain" ? "px-0" : "px-4", className)}>{children}</div>
    </Primitive.Content>
  );
}
