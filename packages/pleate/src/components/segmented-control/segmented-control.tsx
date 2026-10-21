// SegmentedControl: the iOS segmented picker. A thumb slides under the chosen segment; one segment is always
// selected. Built on Radix RadioGroup: arrow keys move and select, screen readers hear a radio group.
"use client";

import { motion } from "motion/react";
import { RadioGroup } from "radix-ui";
import { useId, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useControllableState } from "../../lib/use-controllable-state.ts";
import { spring } from "../../motion/tokens.ts";

export type SegmentedOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  /** Accessible name when the label is an icon only. */
  "aria-label"?: string;
};

export type SegmentedControlProps<T extends string = string> = {
  options: SegmentedOption<T>[];
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  size?: "sm" | "md" | "lg";
  /** Stretch segments to fill the container. */
  fullWidth?: boolean;
  disabled?: boolean;
  name?: string;
  "aria-label"?: string;
  className?: string;
};

const SIZE = {
  sm: { root: "h-8 text-footnote", item: "px-3 [&_svg]:size-3.5" },
  md: { root: "h-9 text-subhead", item: "px-4 [&_svg]:size-4" },
  lg: { root: "h-11 text-callout", item: "px-5 [&_svg]:size-[1.125rem]" },
} as const;

export function SegmentedControl<T extends string = string>({
  options,
  value,
  defaultValue,
  onValueChange,
  size = "md",
  fullWidth = false,
  disabled,
  name,
  className,
  ...props
}: SegmentedControlProps<T>) {
  const [current, setCurrent] = useControllableState<T>({
    value,
    defaultValue: defaultValue ?? options[0]?.value,
    onChange: onValueChange,
  });
  const id = useId();
  return (
    <RadioGroup.Root
      value={current}
      onValueChange={(v) => setCurrent(v as T)}
      orientation="horizontal"
      disabled={disabled}
      name={name}
      aria-label={props["aria-label"]}
      className={cn(
        "relative inline-flex max-w-full rounded-[0.6875rem] bg-fill-2 p-0.5 select-none",
        SIZE[size].root,
        fullWidth ? "flex w-full" : "w-fit",
        disabled && "opacity-50",
        className,
      )}
    >
      {options.map((option, index) => {
        const active = option.value === current;
        const previousActive = options[index - 1]?.value === current;
        return (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            aria-label={option["aria-label"]}
            className={cn(
              "pl-focus-ring pl-touch relative flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-[0.5625rem] font-medium whitespace-nowrap",
              "transition-colors duration-(--pl-duration-fast) disabled:cursor-not-allowed disabled:opacity-40",
              SIZE[size].item,
              fullWidth && "flex-1 px-2",
              active ? "text-fg" : "text-fg-muted hover:text-fg",
              // iOS separators between unselected neighbours
              index > 0 && !active && !previousActive &&
                "before:absolute before:start-0 before:top-1/4 before:h-1/2 before:w-px before:bg-separator",
            )}
          >
            {active && (
              <motion.span
                layoutId={`${id}-thumb`}
                transition={spring.snap}
                aria-hidden="true"
                className="absolute inset-0 rounded-[0.5625rem] bg-surface shadow-knob dark:bg-fill"
              />
            )}
            <span className="relative flex min-w-0 items-center gap-1.5">
              {option.icon}
              {option.label && <span className="truncate">{option.label}</span>}
            </span>
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}
