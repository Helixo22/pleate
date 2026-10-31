// Switch: a squared toggle whose thumb stretches while pressed. Accent or green (tone="success") when on.
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Switch as SwitchPrimitive } from "radix-ui";
import { useId, type ComponentProps, type ReactNode } from "react";
import { ChoiceLabel } from "../../lib/choice-label.tsx";
import { cn } from "../../lib/cn.ts";

export const switchVariants = cva(
  [
    "group pl-focus-ring pl-touch pl-hit relative inline-flex shrink-0 cursor-pointer items-center rounded-sm bg-fill p-px",
    "data-[state=unchecked]:shadow-[inset_0_0_0_1px_var(--pl-border-strong)]",
    "transition-colors duration-(--pl-duration-fast) ease-out disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      size: {
        // --pl-t thumb size, --pl-travel thumb travel, --pl-stretch extra thumb width while pressed
        sm: "h-4 w-[1.625rem] [--pl-t:0.875rem] [--pl-travel:0.625rem] [--pl-stretch:0.125rem]",
        md: "h-5 w-[2.125rem] [--pl-t:1.125rem] [--pl-travel:0.875rem] [--pl-stretch:0.1875rem]",
      },
      tone: {
        accent: "data-[state=checked]:bg-accent",
        success: "data-[state=checked]:bg-success-vivid",
      },
    },
    defaultVariants: { size: "md", tone: "accent" },
  },
);

export type SwitchProps = ComponentProps<typeof SwitchPrimitive.Root> &
  VariantProps<typeof switchVariants> & {
    label?: ReactNode;
    description?: ReactNode;
    labelPlacement?: "start" | "end";
  };

export function Switch({ className, size, tone, label, description, labelPlacement, id, ...props }: SwitchProps) {
  const autoId = useId();
  const controlId = id ?? autoId;
  return (
    <ChoiceLabel id={controlId} label={label} description={description} placement={labelPlacement} disabled={props.disabled}>
      <SwitchPrimitive.Root
        id={controlId}
        aria-describedby={description ? `${controlId}-description` : undefined}
        className={cn(switchVariants({ size, tone }), className)}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "pointer-events-none block h-(--pl-t) w-(--pl-t) rounded-[calc(var(--radius-sm)-1px)] bg-knob shadow-knob",
            "transition-[translate,width] duration-(--pl-duration-fast) ease-out",
            "data-[state=checked]:translate-x-(--pl-travel)",
            "group-active:w-[calc(var(--pl-t)+var(--pl-stretch))]",
            "group-active:data-[state=checked]:translate-x-[calc(var(--pl-travel)-var(--pl-stretch))]",
            "rtl:data-[state=checked]:-translate-x-(--pl-travel)",
          )}
        />
      </SwitchPrimitive.Root>
    </ChoiceLabel>
  );
}
