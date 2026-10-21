// Sidebar: app navigation in the iPadOS style. A sticky column from the breakpoint up (optionally collapsed to an
// icon rail); below it, the same content in a drawer that slides from the start edge (Radix Dialog: focus trap,
// Escape, scroll lock). Control the drawer with open / onOpenChange from your own menu button.
"use client";

import { cva } from "class-variance-authority";
import { Dialog, Slot } from "radix-ui";
import { createContext, useContext, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";

type SidebarContextValue = { collapsed: boolean; drawer: boolean; selection: "soft" | "filled"; close: () => void };
const SidebarContext = createContext<SidebarContextValue>({ collapsed: false, drawer: false, selection: "soft", close: () => {} });

const QUERY = { md: "(min-width: 48rem)", lg: "(min-width: 64rem)" } as const;
const SHOW = { md: "md:flex", lg: "lg:flex" } as const;

export type SidebarProps = {
  children: ReactNode;
  /** Accessible name of the navigation landmark and of the drawer. */
  label?: string;
  /** Phone drawer state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Desktop: icons only. */
  collapsed?: boolean;
  /** Width from which the sidebar is a column instead of a drawer. */
  breakpoint?: keyof typeof QUERY;
  variant?: "plain" | "surface";
  /** Selected row: tinted (soft) or solid accent (filled, as on iPadOS). */
  selection?: "soft" | "filled";
  /** Stick to the viewport while the page scrolls (default), or sit in flow with your own height. */
  sticky?: boolean;
  /** Distance from the top of the viewport for the sticky column (e.g. a header height). */
  top?: string;
  className?: string;
};

export function Sidebar({
  children,
  label = "Sidebar",
  open = false,
  onOpenChange,
  collapsed = false,
  breakpoint = "lg",
  variant = "plain",
  selection = "soft",
  sticky = true,
  top = "0px",
  className,
}: SidebarProps) {
  const desktop = useMediaQuery(QUERY[breakpoint]);
  const close = () => onOpenChange?.(false);
  return (
    <>
      <SidebarContext.Provider value={{ collapsed, drawer: false, selection, close }}>
        <aside
          aria-label={label}
          data-collapsed={collapsed || undefined}
          style={sticky ? { top, height: `calc(100dvh - ${top})` } : undefined}
          className={cn(
            sticky && "sticky",
            "hidden shrink-0 flex-col text-fg transition-[width] duration-(--pl-duration-slow) ease-ios",
            SHOW[breakpoint],
            collapsed ? "w-[4.5rem]" : "w-64",
            variant === "surface" && "border-e border-separator bg-surface-2",
            className,
          )}
        >
          {children}
        </aside>
      </SidebarContext.Provider>

      <Dialog.Root open={open && !desktop} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="pl-fade fixed inset-0 z-(--pl-z-modal) bg-overlay" />
          <Dialog.Content
            aria-describedby={undefined}
            className={cn(
              "pl-drawer fixed inset-y-0 start-0 z-(--pl-z-modal) flex w-[min(20rem,85vw)] flex-col bg-surface text-fg shadow-xl",
              "pt-(--pl-safe-top) pb-(--pl-safe-bottom) ps-(--pl-safe-left) outline-none",
            )}
          >
            <Dialog.Title className="sr-only">{label}</Dialog.Title>
            <SidebarContext.Provider value={{ collapsed: false, drawer: true, selection, close }}>{children}</SidebarContext.Provider>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

type DivProps = HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> };

export function SidebarHeader({ className, ...props }: DivProps) {
  const { collapsed } = useContext(SidebarContext);
  return <div className={cn("flex min-h-14 shrink-0 items-center gap-2 px-4", collapsed && "justify-center px-2", className)} {...props} />;
}

export function SidebarContent({ className, children, ...props }: DivProps) {
  return (
    <nav className={cn("flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-3 py-2", className)} {...(props as HTMLAttributes<HTMLElement>)}>
      {children}
    </nav>
  );
}

export function SidebarFooter({ className, ...props }: DivProps) {
  return <div className={cn("flex shrink-0 flex-col gap-1 border-t border-separator p-3", className)} {...props} />;
}

export function SidebarGroup({ className, label, children, ...props }: DivProps & { label?: ReactNode }) {
  const { collapsed } = useContext(SidebarContext);
  return (
    <div role="group" aria-label={typeof label === "string" ? label : undefined} className={cn("flex flex-col", className)} {...props}>
      {label && (
        <p className={cn("px-3 pb-1.5 text-footnote font-semibold text-fg-muted", collapsed && "sr-only")}>{label}</p>
      )}
      <ul className="flex flex-col gap-px">{children}</ul>
    </div>
  );
}

const itemVariants = cva(
  [
    "pl-focus-ring pl-touch group/item flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-start text-body",
    "transition-colors duration-(--pl-duration-fast) [&_svg]:size-5 [&_svg]:shrink-0",
  ],
  {
    variants: {
      active: { true: "font-semibold", false: "text-fg hover:bg-fill-2" },
      selection: { soft: "", filled: "" },
      collapsed: { true: "justify-center px-0", false: "" },
    },
    compoundVariants: [
      { active: true, selection: "soft", className: "bg-accent-soft text-accent-ink" },
      { active: true, selection: "filled", className: "bg-accent text-on-accent" },
      { active: false, className: "[&_svg]:text-accent-ink" },
    ],
  },
);

export type SidebarItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: Ref<HTMLButtonElement>;
  asChild?: boolean;
  icon?: ReactNode;
  active?: boolean;
  /** Trailing count or status (a Badge, a number…). */
  badge?: ReactNode;
};

export function SidebarItem({ className, asChild, icon, active = false, badge, children, onClick, ...props }: SidebarItemProps) {
  const { collapsed, selection, drawer, close } = useContext(SidebarContext);
  const Comp = asChild ? Slot.Root : "button";
  return (
    <li>
      <Comp
        {...(!asChild && { type: "button" as const })}
        aria-current={active ? "page" : undefined}
        title={collapsed && typeof children === "string" ? children : undefined}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (drawer) close();
        }}
        className={cn(itemVariants({ active, selection, collapsed }), className)}
        {...props}
      >
        {icon}
        <Slot.Slottable>{asChild ? children : <span className={cn("min-w-0 flex-1 truncate", collapsed && "sr-only")}>{children}</span>}</Slot.Slottable>
        {badge && !collapsed && <span className="ms-auto shrink-0 text-subhead text-fg-muted group-aria-[current=page]/item:text-current">{badge}</span>}
      </Comp>
    </li>
  );
}
