// ToggleGroup: pressable options on a bordered rail, one at a time (type="single", can be cleared) or several
// (type="multiple"). Pressed items sit raised on the rail. Toggle is one pressable button on its own (bold, mute,
// "show map"). Radix: arrow keys move between items, Space/Enter press, aria-pressed (or radio semantics) for free.
"use client";

import { Toggle as TogglePrimitive, ToggleGroup as Primitive } from "radix-ui";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

type Size = "sm" | "md";

const RAIL = { sm: "h-8 text-footnote", md: "h-9 text-subhead" } as const;
const ITEM = {
  sm: "h-7 px-2.5 [&_svg]:size-3.5",
  md: "h-8 px-3 [&_svg]:size-4",
} as const;
const ICON_ONLY = { sm: "w-7 px-0", md: "w-8 px-0" } as const;

const item =
  "pl-focus-ring pl-touch inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 font-medium whitespace-nowrap select-none " +
  "transition-[background-color,color,box-shadow] duration-(--pl-duration-fast) ease-out disabled:cursor-not-allowed disabled:opacity-40 " +
  "[&_svg]:shrink-0 [&_svg]:opacity-85";

const SizeContext = createContext<Size>("md");

export type ToggleGroupProps = ComponentProps<typeof Primitive.Root> & { size?: Size };

export function ToggleGroup({ className, size = "md", ...props }: ToggleGroupProps) {
  return (
    <SizeContext.Provider value={size}>
      <Primitive.Root
        className={cn(
          "pl-field inline-flex w-fit max-w-full items-center gap-0.5 rounded-md bg-surface-2 p-0.5 [--pl-field-border:var(--pl-separator)] data-disabled:opacity-50",
          RAIL[size],
          className,
        )}
        {...props}
      />
    </SizeContext.Provider>
  );
}

export type ToggleGroupItemProps = ComponentProps<typeof Primitive.Item> & {
  icon?: ReactNode;
};

export function ToggleGroupItem({ className, icon, children, ...props }: ToggleGroupItemProps) {
  const size = useContext(SizeContext);
  return (
    <Primitive.Item
      className={cn(
        item,
        ITEM[size],
        !children && ICON_ONLY[size],
        "rounded-[calc(var(--radius-md)-2px)] text-fg-muted hover:text-fg",
        "data-[state=on]:bg-surface data-[state=on]:text-fg data-[state=on]:shadow-[inset_0_0_0_1px_var(--pl-border),var(--pl-lip)] dark:data-[state=on]:bg-fill-2",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </Primitive.Item>
  );
}

export type ToggleProps = ComponentProps<typeof TogglePrimitive.Root> & {
  size?: Size;
  icon?: ReactNode;
};

export function Toggle({ className, size = "md", icon, children, ...props }: ToggleProps) {
  return (
    <TogglePrimitive.Root
      className={cn(
        item,
        "pl-field bg-surface text-fg-muted hover:bg-surface-2 hover:text-fg",
        "data-[state=on]:bg-accent-soft data-[state=on]:text-accent-ink data-[state=on]:[--pl-field-border:transparent] data-[state=on]:hover:bg-accent-soft-hover",
        size === "sm" ? "h-8 rounded-sm px-2.5 text-footnote [&_svg]:size-3.5" : "h-9 rounded-md px-3 text-subhead [&_svg]:size-4",
        !children && (size === "sm" ? "w-8 px-0" : "w-9 px-0"),
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </TogglePrimitive.Root>
  );
}
