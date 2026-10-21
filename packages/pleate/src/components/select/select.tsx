// Select: Radix Select with an iOS menu look — a field-styled trigger and a rounded, softly shadowed list that grows
// from it, with a checkmark on the chosen row. Composable like shadcn/ui (Select, SelectTrigger, SelectContent,
// SelectItem, SelectGroup, SelectLabel, SelectSeparator).
"use client";

import { Select as SelectPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { fieldVariants, type FieldVariantProps } from "../../lib/field-variants.ts";
import { CheckIcon, ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon } from "../../lib/icons.tsx";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export type SelectTriggerProps = ComponentProps<typeof SelectPrimitive.Trigger> &
  FieldVariantProps & { invalid?: boolean; startAdornment?: ReactNode };

export function SelectTrigger({ className, variant, size, invalid, startAdornment, children, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      aria-invalid={invalid || undefined}
      className={cn(
        fieldVariants({ variant, size }),
        "pl-touch cursor-pointer justify-between text-start focus-visible:outline-ring",
        "aria-invalid:shadow-[inset_0_0_0_1.5px_var(--pl-danger-ink)] disabled:cursor-not-allowed disabled:opacity-50",
        "data-placeholder:text-fg-subtle [&>span]:truncate",
        className,
      )}
      {...props}
    >
      {startAdornment && <span className="flex shrink-0 items-center text-fg-muted">{startAdornment}</span>}
      <span className="flex min-w-0 flex-1 items-center gap-2 text-start">{children}</span>
      <SelectPrimitive.Icon asChild>
        <ChevronUpDownIcon className="shrink-0 text-fg-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  position = "popper",
  sideOffset = 6,
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        sideOffset={sideOffset}
        className={cn(
          "pl-pop relative z-(--pl-z-dropdown) overflow-hidden rounded-xl bg-elevated text-fg shadow-lg",
          "max-h-(--radix-select-content-available-height) min-w-[max(var(--radix-select-trigger-width),10rem)]",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center text-fg-muted [&_svg]:size-4">
          <ChevronUpIcon />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center text-fg-muted [&_svg]:size-4">
          <ChevronDownIcon />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  description,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item> & { description?: ReactNode }) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "pl-touch relative flex min-h-10 cursor-pointer items-center gap-2 rounded-md py-2 ps-8 pe-3 text-body outline-none",
        "transition-colors duration-(--pl-duration-instant) data-highlighted:bg-fill-2 data-disabled:pointer-events-none data-disabled:opacity-40",
        "[&_svg]:size-[1.125rem]",
        className,
      )}
      {...props}
    >
      <span className="absolute start-2.5 flex size-4 items-center justify-center text-accent-ink">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" strokeWidth={2.75} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <span className="flex min-w-0 flex-col">
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        {description && <span className="text-footnote text-fg-muted">{description}</span>}
      </span>
    </SelectPrimitive.Item>
  );
}

export function SelectLabel({ className, ...props }: ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn("px-3 pt-2 pb-1 text-footnote font-semibold text-fg-muted", className)}
      {...props}
    />
  );
}

export function SelectSeparator({ className, ...props }: ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("mx-2 my-1.5 h-px bg-separator", className)} {...props} />;
}
