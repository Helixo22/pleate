// TabBar: the iOS bottom tab bar for phone layouts. "classic" spans the screen edge to edge above the home indicator;
// "floating" is the newer detached capsule (solid, with a soft shadow, no glass) where a pill slides to the active
// tab. Items are links (asChild + active) or buttons driven by value / onValueChange. Hide it from a breakpoint up
// with hideFrom, and keep content clear of it with <TabBarSpacer />.
"use client";

import { motion } from "motion/react";
import { Slot } from "radix-ui";
import { createContext, useContext, useId, type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "../../lib/cn.ts";
import { useControllableState } from "../../lib/use-controllable-state.ts";
import { spring } from "../../motion/tokens.ts";

type Variant = "classic" | "floating";
type TabBarContextValue = { value?: string; select: (value: string) => void; variant: Variant; pillId: string };
const TabBarContext = createContext<TabBarContextValue | null>(null);

const HIDE = { never: "", md: "md:hidden", lg: "lg:hidden" } as const;

export type TabBarProps = {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: Variant;
  /** Hide the bar from this breakpoint up (desktop layouts use a sidebar instead). */
  hideFrom?: keyof typeof HIDE;
  /** Fixed to the bottom of the viewport (default) or in flow (e.g. inside a demo frame). */
  position?: "fixed" | "static";
  label?: string;
  className?: string;
};

export function TabBar({
  children,
  value,
  defaultValue,
  onValueChange,
  variant = "classic",
  hideFrom = "never",
  position = "fixed",
  label = "Tabs",
  className,
}: TabBarProps) {
  const [current, setCurrent] = useControllableState({ value, defaultValue: defaultValue ?? "", onChange: onValueChange });
  const pillId = useId();
  const floating = variant === "floating";
  return (
    <TabBarContext.Provider value={{ value: current, select: setCurrent, variant, pillId }}>
      <nav
        aria-label={label}
        className={cn(
          "z-(--pl-z-sticky) text-fg",
          position === "fixed" && "fixed inset-x-0 bottom-0",
          floating
            ? "px-[max(1rem,var(--pl-safe-left))] pt-2 pb-[max(0.75rem,var(--pl-safe-bottom))]"
            : "bg-surface pb-(--pl-safe-bottom) shadow-[inset_0_1px_0_var(--pl-separator)]",
          HIDE[hideFrom],
          className,
        )}
      >
        <ul
          className={cn(
            "mx-auto flex",
            floating ? "h-16 max-w-md items-center rounded-full bg-elevated p-1.5 shadow-lg" : "h-[3.25rem] max-w-2xl items-stretch",
          )}
        >
          {children}
        </ul>
      </nav>
    </TabBarContext.Provider>
  );
}

export type TabBarItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
  ref?: Ref<HTMLButtonElement>;
  asChild?: boolean;
  /** Identifier for value-driven bars. */
  value?: string;
  /** Selected state for link-driven bars (e.g. from the current pathname). */
  active?: boolean;
  icon: ReactNode;
  /** Icon variant when selected (iOS uses filled glyphs). */
  activeIcon?: ReactNode;
  label: ReactNode;
  /** A count or dot on the icon. */
  badge?: ReactNode;
};

export function TabBarItem({ className, asChild, value, active, icon, activeIcon, label, badge, onClick, children, ...props }: TabBarItemProps) {
  const context = useContext(TabBarContext);
  if (!context) throw new Error("pleate: <TabBarItem> must be inside <TabBar>.");
  const selected = active ?? (value !== undefined && context.value === value);
  const floating = context.variant === "floating";
  const Comp = asChild ? Slot.Root : "button";
  return (
    <li className="relative flex flex-1">
      {floating && selected && (
        <motion.span
          layoutId={context.pillId}
          transition={spring.snap}
          className="absolute inset-0 rounded-full bg-accent-soft"
          aria-hidden="true"
        />
      )}
      <Comp
        {...(!asChild && { type: "button" as const })}
        aria-current={selected ? "page" : undefined}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (value !== undefined) context.select(value);
        }}
        className={cn(
          "pl-focus-ring pl-touch relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full",
          "text-[0.625rem] leading-3 font-medium transition-colors duration-(--pl-duration-fast)",
          "[&_svg]:size-6 motion-safe:active:[&_svg]:scale-90 [&_svg]:transition-[scale] [&_svg]:duration-(--pl-duration-fast)",
          selected ? "text-accent-ink" : "text-fg-muted hover:text-fg",
          floating && "text-[0.6875rem]",
          className,
        )}
        {...props}
      >
        <span className="relative">
          {selected && activeIcon ? activeIcon : icon}
          {badge !== undefined && badge !== null && badge !== false && (
            <span className="absolute -end-2.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.625rem] leading-none font-semibold text-on-status">
              {badge === true ? "" : badge}
            </span>
          )}
        </span>
        <Slot.Slottable>{asChild ? children : <span className="truncate">{label}</span>}</Slot.Slottable>
      </Comp>
    </li>
  );
}

/** Empty block as tall as a fixed TabBar, placed at the end of the page content. */
export function TabBarSpacer({ variant = "classic", hideFrom = "never" }: { variant?: Variant; hideFrom?: keyof typeof HIDE }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "shrink-0",
        variant === "floating" ? "h-[calc(5.25rem+max(0.75rem,var(--pl-safe-bottom)))]" : "h-[calc(3.25rem+var(--pl-safe-bottom))]",
        HIDE[hideFrom],
      )}
    />
  );
}
