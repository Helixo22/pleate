// Checkbox: a rounded square (default) or the iOS selection circle (shape="circle", as in Mail and Reminders), with a
// 1.5px edge, a drawn-in checkmark and an indeterminate dash. Pass `label` and
// `description` for a ready-made clickable row.
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { useId, type ComponentProps, type ReactNode } from "react";
import { ChoiceLabel } from "../../lib/choice-label.tsx";
import { cn } from "../../lib/cn.ts";
import { CheckIcon, MinusIcon } from "../../lib/icons.tsx";

export const checkboxVariants = cva(
  [
    "peer pl-focus-ring [--pl-field-border:var(--pl-border-strong)] shadow-[inset_0_0_0_1.5px_var(--pl-field-border)] relative grid shrink-0 cursor-pointer place-items-center bg-transparent text-on-accent",
    "transition-[background-color,box-shadow] duration-(--pl-duration-fast) ease-out hover:[--pl-field-border:var(--pl-fg-muted)]",
    "data-[state=checked]:bg-accent data-[state=checked]:shadow-none data-[state=indeterminate]:bg-accent data-[state=indeterminate]:shadow-none",
    "aria-invalid:[--pl-field-border:var(--pl-danger-ink)] disabled:cursor-not-allowed disabled:opacity-50",
    "after:absolute after:-inset-2.5 after:content-['']",
  ],
  {
    variants: {
      size: {
        sm: "size-4 [&_svg]:size-3",
        md: "size-5 [&_svg]:size-3.5",
        lg: "size-[1.375rem] [&_svg]:size-4",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-[30%]",
      },
    },
    defaultVariants: { size: "md", shape: "square" },
  },
);

export type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root> &
  VariantProps<typeof checkboxVariants> & {
    label?: ReactNode;
    description?: ReactNode;
    labelPlacement?: "start" | "end";
    invalid?: boolean;
  };

export function Checkbox({
  className,
  size,
  shape,
  label,
  description,
  labelPlacement,
  invalid,
  id,
  ...props
}: CheckboxProps) {
  const autoId = useId();
  const controlId = id ?? autoId;
  return (
    <ChoiceLabel
      id={controlId}
      label={label}
      description={description}
      placement={labelPlacement}
      disabled={props.disabled}
    >
      <CheckboxPrimitive.Root
        id={controlId}
        aria-invalid={invalid || undefined}
        aria-describedby={description ? `${controlId}-description` : undefined}
        className={cn(checkboxVariants({ size, shape }), description && "mt-px", className)}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="grid place-items-center [&_path]:[stroke-dasharray:24] motion-safe:[&_path]:animate-[pl-check_var(--pl-duration-base)_var(--pl-ease-out)_both]">
          {props.checked === "indeterminate" ? <MinusIcon strokeWidth={3} /> : <CheckIcon strokeWidth={3} />}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </ChoiceLabel>
  );
}
