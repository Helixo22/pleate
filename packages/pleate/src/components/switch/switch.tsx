// Switch: the iOS capsule toggle (UISwitch proportions) with a round knob that stretches while pressed. On, it fills
// with the accent so it follows the palette; tone="success" gives the system green. Off, it is a quiet gray fill.
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Switch as SwitchPrimitive } from "radix-ui";
import { useId, type ComponentProps, type ReactNode } from "react";
import { ChoiceLabel } from "../../lib/choice-label.tsx";
import { cn } from "../../lib/cn.ts";

export const switchVariants = cva(
  [
    "group pl-focus-ring pl-touch pl-hit relative inline-flex shrink-0 cursor-pointer items-center rounded-full bg-fill p-0.5",
    "transition-colors duration-(--pl-duration-base) ease-out disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      size: {
        // --pl-t thumb size, --pl-travel thumb travel, --pl-stretch extra thumb width while pressed
        sm: "h-5 w-8 [--pl-t:1rem] [--pl-travel:0.75rem] [--pl-stretch:0.25rem]",
        md: "h-7 w-[2.875rem] [--pl-t:1.5rem] [--pl-travel:1.125rem] [--pl-stretch:0.375rem]",
        /** UISwitch at its native 51×31. */
        lg: "h-[1.9375rem] w-[3.1875rem] [--pl-t:1.6875rem] [--pl-travel:1.25rem] [--pl-stretch:0.4375rem]",
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
            "pointer-events-none block h-(--pl-t) w-(--pl-t) rounded-full bg-knob shadow-knob",
            "transition-[translate,width] duration-(--pl-duration-base) ease-out",
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
