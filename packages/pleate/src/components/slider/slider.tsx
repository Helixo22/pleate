// Slider: iOS track with a white knob, or "bar" — the thick Control Center style where the fill is the handle.
// One value or a range (pass two values). Keyboard: arrows, Page Up/Down, Home/End (Radix).
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Slider as SliderPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";

const sliderVariants = cva("relative flex w-full touch-none items-center select-none data-disabled:opacity-50", {
  variants: {
    variant: {
      knob: "",
      bar: "pl-focus-within-ring rounded-(--pl-bar-radius)",
    },
    size: {
      sm: "[--pl-bar:1.75rem] [--pl-bar-radius:var(--radius-md)] [--pl-knob-size:1.25rem] [--pl-track:0.25rem]",
      md: "[--pl-bar:2.5rem] [--pl-bar-radius:var(--radius-lg)] [--pl-knob-size:1.75rem] [--pl-track:0.25rem]",
      lg: "[--pl-bar:3.25rem] [--pl-bar-radius:var(--radius-xl)] [--pl-knob-size:2rem] [--pl-track:0.375rem]",
    },
  },
  defaultVariants: { variant: "knob", size: "md" },
});

export type SliderProps = ComponentProps<typeof SliderPrimitive.Root> &
  VariantProps<typeof sliderVariants> & {
    /** Accessible name for each thumb, e.g. ["Minimum price", "Maximum price"]. */
    thumbLabels?: string[];
  };

export function Slider({ className, variant, size, thumbLabels, value, defaultValue, ...props }: SliderProps) {
  const count = (value ?? defaultValue ?? [props.min ?? 0]).length;
  const bar = variant === "bar";
  return (
    <SliderPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      className={cn(sliderVariants({ variant, size }), bar ? "h-(--pl-bar)" : "h-(--pl-knob-size)", className)}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative grow overflow-hidden bg-fill",
          bar ? "h-full rounded-(--pl-bar-radius)" : "h-(--pl-track) rounded-full",
        )}
      >
        <SliderPrimitive.Range className="absolute h-full bg-accent" />
      </SliderPrimitive.Track>
      {Array.from({ length: count }, (_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={thumbLabels?.[i]}
          className={cn(
            "block cursor-grab active:cursor-grabbing",
            bar
              ? "h-(--pl-bar) w-0 outline-none"
              : [
                  "pl-focus-ring size-(--pl-knob-size) rounded-full bg-knob shadow-knob",
                  "transition-[scale] duration-(--pl-duration-fast) ease-ios motion-safe:active:scale-110",
                ],
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}
