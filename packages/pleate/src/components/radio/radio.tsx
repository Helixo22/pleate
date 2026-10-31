// RadioGroup + Radio: a bordered circle that fills with the accent around a dot. Arrow keys move between options (Radix).
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { RadioGroup as RadioPrimitive } from "radix-ui";
import { useId, type ComponentProps, type ReactNode } from "react";
import { ChoiceLabel } from "../../lib/choice-label.tsx";
import { cn } from "../../lib/cn.ts";

export function RadioGroup({ className, ...props }: ComponentProps<typeof RadioPrimitive.Root>) {
  return <RadioPrimitive.Root className={cn("grid gap-3 data-[orientation=horizontal]:flex data-[orientation=horizontal]:flex-wrap data-[orientation=horizontal]:gap-5", className)} {...props} />;
}

export const radioVariants = cva(
  [
    "pl-focus-ring pl-field relative grid shrink-0 cursor-pointer place-items-center rounded-full bg-surface",
    "transition-[background-color,box-shadow] duration-(--pl-duration-fast) ease-out hover:[--pl-field-border:var(--pl-fg-subtle)]",
    "data-[state=checked]:bg-accent data-[state=checked]:pl-lift disabled:cursor-not-allowed disabled:opacity-50",
    "after:absolute after:-inset-2.5 after:content-['']",
  ],
  {
    variants: {
      size: {
        sm: "size-4 [--pl-dot:0.375rem]",
        md: "size-[1.125rem] [--pl-dot:0.375rem]",
        lg: "size-5 [--pl-dot:0.5rem]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type RadioProps = ComponentProps<typeof RadioPrimitive.Item> &
  VariantProps<typeof radioVariants> & {
    label?: ReactNode;
    description?: ReactNode;
    labelPlacement?: "start" | "end";
  };

export function Radio({ className, size, label, description, labelPlacement, id, ...props }: RadioProps) {
  const autoId = useId();
  const controlId = id ?? autoId;
  return (
    <ChoiceLabel id={controlId} label={label} description={description} placement={labelPlacement} disabled={props.disabled}>
      <RadioPrimitive.Item
        id={controlId}
        aria-describedby={description ? `${controlId}-description` : undefined}
        className={cn(radioVariants({ size }), description && "mt-px", className)}
        {...props}
      >
        <RadioPrimitive.Indicator className="block size-(--pl-dot) rounded-full bg-on-accent motion-safe:animate-[pl-pop-in_var(--pl-duration-fast)_var(--pl-ease-out)]" />
      </RadioPrimitive.Item>
    </ChoiceLabel>
  );
}
