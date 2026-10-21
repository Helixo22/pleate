// Tabs: switch between views of the same context. Three looks — "underline" with a sliding bar, "pill" with a sliding
// capsule, "soft" with tinted chips — all with Radix keyboard support (arrows, Home/End). Long lists scroll
// sideways on phones. Panels fade in.
"use client";

import { motion } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { createContext, useContext, useId, type ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";
import { useControllableState } from "../../lib/use-controllable-state.ts";
import { spring } from "../../motion/tokens.ts";

type Variant = "underline" | "pill" | "soft";
type Size = "sm" | "md";
const TabsContext = createContext<{ value: string; variant: Variant; size: Size; id: string }>({
  value: "",
  variant: "underline",
  size: "md",
  id: "",
});

export type TabsProps = ComponentProps<typeof TabsPrimitive.Root> & { variant?: Variant; size?: Size };

export function Tabs({ value, defaultValue, onValueChange, variant = "underline", size = "md", className, ...props }: TabsProps) {
  const [current, setCurrent] = useControllableState({ value, defaultValue: defaultValue ?? "", onChange: onValueChange });
  const id = useId();
  return (
    <TabsContext.Provider value={{ value: current, variant, size, id }}>
      <TabsPrimitive.Root value={current} onValueChange={setCurrent} className={cn("flex flex-col gap-4", className)} {...props} />
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  const { variant } = useContext(TabsContext);
  return (
    <TabsPrimitive.List
      className={cn(
        "pl-no-scrollbar relative flex max-w-full overflow-x-auto",
        variant === "underline" && "gap-1 shadow-[inset_0_-1px_0_var(--pl-separator)]",
        variant === "pill" && "w-fit gap-0.5 rounded-full bg-fill-2 p-1",
        variant === "soft" && "gap-1.5",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, value, children, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { value: current, variant, size, id } = useContext(TabsContext);
  const active = current === value;
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        "pl-focus-ring pl-touch relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 font-semibold whitespace-nowrap",
        "transition-colors duration-(--pl-duration-fast) disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
        size === "sm" ? "text-footnote" : "text-subhead",
        variant === "underline" && [size === "sm" ? "h-9 px-2.5" : "h-11 px-3", active ? "text-fg" : "text-fg-muted hover:text-fg"],
        variant === "pill" && [size === "sm" ? "h-7 px-3" : "h-9 px-4", "rounded-full", active ? "text-fg" : "text-fg-muted hover:text-fg"],
        variant === "soft" && [
          size === "sm" ? "h-8 px-3" : "h-9 px-4",
          "rounded-full",
          active ? "bg-accent-soft text-accent-ink" : "text-fg-muted hover:bg-fill-2 hover:text-fg",
        ],
        className,
      )}
      {...props}
    >
      {active && variant === "underline" && (
        <motion.span
          layoutId={`${id}-indicator`}
          transition={spring.snap}
          className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent-ink"
          aria-hidden="true"
        />
      )}
      {active && variant === "pill" && (
        <motion.span
          layoutId={`${id}-indicator`}
          transition={spring.snap}
          className="absolute inset-0 rounded-full bg-surface shadow-sm dark:bg-fill"
          aria-hidden="true"
        />
      )}
      <span className="relative inline-flex items-center gap-1.5">{children}</span>
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("pl-focus-ring rounded-md data-[state=active]:animate-[pl-fade-in_var(--pl-duration-base)_var(--pl-ease-out)]", className)}
      {...props}
    />
  );
}
