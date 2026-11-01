// RadioGroup + Radio: a 1.5px circle that fills with the accent around a dot, or indicator="check", the iOS list
// style: nothing until chosen, then an accent checkmark (put it at the trailing end of the row, labelPlacement="start").
// Arrow keys move between options (Radix).
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { RadioGroup as RadioPrimitive } from "radix-ui";
import { useId, type ComponentProps, type ReactNode } from "react";
import { ChoiceLabel } from "../../lib/choice-label.tsx";
import { cn } from "../../lib/cn.ts";
import { CheckIcon } from "../../lib/icons.tsx";

export function RadioGroup({ className, ...props }: ComponentProps<typeof RadioPrimitive.Root>) {
  return <RadioPrimitive.Root className={cn("grid gap-3 data-[orientation=horizontal]:flex data-[orientation=horizontal]:flex-wrap data-[orientation=horizontal]:gap-5", className)} {...props} />;
}

export const radioVariants = cva(
  [
    "pl-focus-ring relative grid shrink-0 cursor-pointer place-items-center rounded-full",
    "transition-[background-color,box-shadow] duration-(--pl-duration-fast) ease-out disabled:cursor-not-allowed disabled:opacity-50",
    "after:absolute after:-inset-2.5 after:content-['']",
  ],
  {
    variants: {
      size: {
        sm: "size-4 [--pl-dot:0.375rem] [&_svg]:size-4",
        md: "size-5 [--pl-dot:0.5rem] [&_svg]:size-5",
        lg: "size-[1.375rem] [--pl-dot:0.5625rem] [&_svg]:size-[1.375rem]",
      },
      indicator: {
        dot: [
          "[--pl-field-border:var(--pl-border-strong)] shadow-[inset_0_0_0_1.5px_var(--pl-field-border)] hover:[--pl-field-border:var(--pl-fg-muted)]",
          "data-[state=checked]:bg-accent data-[state=checked]:shadow-none",
        ],
        check: "text-accent-ink",
      },
    },
    defaultVariants: { size: "md", indicator: "dot" },
  },
);

export type RadioProps = ComponentProps<typeof RadioPrimitive.Item> &
  VariantProps<typeof radioVariants> & {
    label?: ReactNode;
    description?: ReactNode;
    labelPlacement?: "start" | "end";
  };

export function Radio({ className, size, indicator, label, description, labelPlacement, id, ...props }: RadioProps) {
  const autoId = useId();
  const controlId = id ?? autoId;
  return (
    <ChoiceLabel id={controlId} label={label} description={description} placement={labelPlacement} disabled={props.disabled}>
      <RadioPrimitive.Item
        id={controlId}
        aria-describedby={description ? `${controlId}-description` : undefined}
        className={cn(radioVariants({ size, indicator }), description && "mt-px", className)}
        {...props}
      >
        {indicator === "check" ? (
          <RadioPrimitive.Indicator className="grid place-items-center [&_path]:[stroke-dasharray:24] motion-safe:[&_path]:animate-[pl-check_var(--pl-duration-base)_var(--pl-ease-out)_both]">
            <CheckIcon strokeWidth={2.75} />
          </RadioPrimitive.Indicator>
        ) : (
          <RadioPrimitive.Indicator className="block size-(--pl-dot) rounded-full bg-on-accent motion-safe:animate-[pl-pop-in_var(--pl-duration-fast)_var(--pl-ease-out)]" />
        )}
      </RadioPrimitive.Item>
    </ChoiceLabel>
  );
}
