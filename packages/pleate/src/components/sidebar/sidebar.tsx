// Sidebar: app navigation in the iPadOS style. A sticky column from the breakpoint up (optionally collapsed to an
// icon rail); below it, the same content in a drawer that slides from the start edge (Radix Dialog: focus trap,
// Escape, scroll lock). Control the drawer with open / onOpenChange from your own menu button. Groups can sit in their
// own card (variant="card"), carry an icon, and fold away under their label (collapsible, animated). SidebarSearch
// filters the rows by text: matching rows stay, groups whose label matches keep all their rows, empty groups hide,
// and a "no results" line shows when nothing is left.
"use client";

import { cva } from "class-variance-authority";
import { Dialog, Slot } from "radix-ui";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronRightIcon } from "../../lib/icons.tsx";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { SearchBar } from "../search-bar/search-bar.tsx";

type SidebarContextValue = {
  collapsed: boolean;
  drawer: boolean;
  selection: "soft" | "filled";
  close: () => void;
  query: string;
  setQuery: (query: string) => void;
};
const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  drawer: false,
  selection: "filled",
  close: () => {},
  query: "",
  setQuery: () => {},
});
/** Whether the enclosing group's label matches the filter (then all its rows stay). */
const GroupMatchContext = createContext(false);

const QUERY = { md: "(min-width: 48rem)", lg: "(min-width: 64rem)" } as const;
const SHOW = { md: "md:flex", lg: "lg:flex" } as const;

/** Case and accent insensitive form used by the filter. */
const fold = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
const textOf = (node: ReactNode) => (typeof node === "string" || typeof node === "number" ? String(node) : "");

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
  /** Filter text (controlled). Usually left to SidebarSearch. */
  query?: string;
  onQueryChange?: (query: string) => void;
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
  selection = "filled",
  sticky = true,
  top = "0px",
  query: queryProp,
  onQueryChange,
  className,
}: SidebarProps) {
  const desktop = useMediaQuery(QUERY[breakpoint]);
  const [ownQuery, setOwnQuery] = useState("");
  const query = queryProp ?? ownQuery;
  const setQuery = (next: string) => {
    setOwnQuery(next);
    onQueryChange?.(next);
  };
  const close = () => onOpenChange?.(false);
  // The rail shows icons only, so the filter is off while collapsed.
  const railQuery = collapsed ? "" : query;
  return (
    <>
      <SidebarContext.Provider value={{ collapsed, drawer: false, selection, close, query: railQuery, setQuery }}>
        <aside
          aria-label={label}
          data-collapsed={collapsed || undefined}
          style={sticky ? { top, height: `calc(100dvh - ${top})` } : undefined}
          className={cn(
            sticky && "sticky",
            "hidden shrink-0 flex-col overflow-hidden text-fg [--pl-sidebar-bg:var(--pl-bg)] transition-[width] duration-(--pl-duration-slow) ease-out motion-reduce:transition-none",
            SHOW[breakpoint],
            collapsed ? "w-[4.25rem]" : "w-[17.5rem]",
            variant === "surface" && "border-e border-separator bg-bg",
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
            // Escape in a filled filter clears it first; the next Escape closes the drawer.
            onEscapeKeyDown={(event) => {
              if (query && (event.target as HTMLElement | null)?.closest?.("[data-sidebar-search]")) {
                event.preventDefault();
                setQuery("");
              }
            }}
            className={cn(
              "pl-drawer fixed inset-y-0 start-0 z-(--pl-z-modal) flex w-[min(20rem,85vw)] flex-col bg-bg text-fg shadow-xl [--pl-sidebar-bg:var(--pl-bg)]",
              "pt-(--pl-safe-top) pb-(--pl-safe-bottom) ps-(--pl-safe-left) outline-none",
            )}
          >
            <Dialog.Title className="sr-only">{label}</Dialog.Title>
            <SidebarContext.Provider value={{ collapsed: false, drawer: true, selection, close, query, setQuery }}>{children}</SidebarContext.Provider>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

type DivProps = HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> };

export function SidebarHeader({ className, ...props }: DivProps) {
  const { collapsed } = useContext(SidebarContext);
  return <div className={cn("flex min-h-14 shrink-0 items-center gap-2 px-5 pt-4", collapsed && "justify-center px-0", className)} {...props} />;
}

export type SidebarSearchProps = {
  placeholder?: string;
  /** Accessible name of the field. */
  label?: string;
  /** Focus shortcut, as on SearchBar. */
  shortcut?: "/" | "mod+k";
  className?: string;
};

/** Filters the sidebar rows as you type. ↓ moves into the results, Enter opens the first one, Escape clears. */
export function SidebarSearch({ placeholder = "Filter", label = "Filter navigation", shortcut, className }: SidebarSearchProps) {
  const { collapsed, query, setQuery } = useContext(SidebarContext);
  const box = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const firstMatch = () =>
    box.current?.closest("aside, [role=dialog]")?.querySelector<HTMLElement>("[data-sidebar-match] :is(a, button):not([disabled])");
  useEffect(() => {
    const root = box.current?.closest("aside, [role=dialog]");
    setCount(query ? (root?.querySelectorAll("[data-sidebar-match]").length ?? 0) : 0);
  }, [query]);
  if (collapsed) return null;
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      firstMatch()?.focus();
    }
    if (event.key === "Enter" && query) {
      event.preventDefault();
      firstMatch()?.click();
    }
  };
  return (
    <div ref={box} data-sidebar-search="" className={cn("shrink-0 px-3 pb-2", className)}>
      <SearchBar size="sm" variant="filled" label={label} aria-label={label} placeholder={placeholder} value={query} onValueChange={setQuery} onKeyDown={onKeyDown} shortcut={shortcut} />
      <p role="status" className="sr-only">
        {query ? (count === 1 ? "1 result" : `${count} results`) : ""}
      </p>
    </div>
  );
}

export type SidebarContentProps = DivProps & {
  /** Shown when the filter leaves nothing (default: No results for "query"). */
  emptyLabel?: ReactNode;
};

/** Up/Down (and Home/End) move between the visible rows and fold buttons, like a list. */
function moveFocus(event: KeyboardEvent<HTMLElement>) {
  const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
  if (!keys.includes(event.key) || event.altKey || event.metaKey || event.ctrlKey) return;
  const target = event.target as HTMLElement;
  if (target.matches("input, textarea, [contenteditable]")) return;
  const rows = [...event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")].filter(
    (el) => !el.closest("[inert], [hidden]"),
  );
  const at = rows.indexOf(target.closest<HTMLElement>("a[href], button") ?? target);
  if (!rows.length) return;
  event.preventDefault();
  const next =
    event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : Math.min(rows.length - 1, Math.max(0, at + (event.key === "ArrowDown" ? 1 : -1)));
  rows[next]?.focus();
  rows[next]?.scrollIntoView({ block: "nearest" });
}

export function SidebarContent({ className, children, emptyLabel, onKeyDown, ...props }: SidebarContentProps) {
  const { query } = useContext(SidebarContext);
  return (
    <nav
      className={cn("group/nav flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-3 py-2", className)}
      onKeyDown={(event) => {
        onKeyDown?.(event as unknown as KeyboardEvent<HTMLDivElement>);
        if (!event.defaultPrevented) moveFocus(event);
      }}
      {...(props as HTMLAttributes<HTMLElement>)}
    >
      {children}
      {query && (
        <p className="hidden px-2.5 py-6 text-center text-subhead text-fg-muted group-[:not(:has([data-sidebar-match]))]/nav:block">
          {emptyLabel ?? (
            <>
              No results for <span className="text-fg">“{query}”</span>
            </>
          )}
        </p>
      )}
    </nav>
  );
}

export function SidebarFooter({ className, ...props }: DivProps) {
  const { collapsed } = useContext(SidebarContext);
  return <div className={cn("flex shrink-0 flex-col gap-1 border-t border-separator p-3", collapsed && "items-center px-2", className)} {...props} />;
}

export type SidebarGroupProps = DivProps & {
  label?: ReactNode;
  /** Leading icon of the label (and of the fold button). */
  icon?: ReactNode;
  /** Text the filter matches against when the label is not a string. */
  textValue?: string;
  /** plain: rows on the sidebar itself; card: the group sits in its own rounded card. */
  variant?: "plain" | "card";
  /** The label becomes a button that folds the group away. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Controlled fold state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** false: chrome, not results; the group hides while a filter is active. */
  filterable?: boolean;
  /** Quiet figure after the label, usually the number of rows. */
  count?: ReactNode;
  /** Small mark after the label (e.g. a "New" badge for a section that is mostly new). */
  badge?: ReactNode;
  /** The label stays pinned at the top of the scrolling sidebar while you scroll through a long group. */
  stickyLabel?: boolean;
};

export function SidebarGroup({
  className,
  label,
  icon,
  textValue,
  variant = "plain",
  collapsible = false,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  filterable = true,
  count,
  badge,
  stickyLabel = false,
  children,
  ...props
}: SidebarGroupProps) {
  const { collapsed, query } = useContext(SidebarContext);
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const open = openProp ?? ownOpen;
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };
  const listId = useId();
  const filtering = !!query;
  const labelText = textValue ?? textOf(label);
  const groupMatch = filtering && !!labelText && fold(labelText).includes(fold(query));
  const foldable = collapsible && !!label && !collapsed && !filtering;
  const shown = !foldable || open;

  if (filtering && !filterable) return null;
  return (
    <div
      role="group"
      aria-label={labelText || undefined}
      className={cn(
        "flex flex-col",
        variant === "card" && !collapsed && "rounded-xl bg-surface p-1.5 pt-2",
        // Rail: groups are separated by a hairline instead of their labels.
        collapsed && "[&+&]:border-t [&+&]:border-separator [&+&]:pt-2",
        filtering && "[&:not(:has([data-sidebar-match]))]:hidden",
        className,
      )}
      {...props}
    >
      {label &&
        (foldable ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen(!open)}
            className={cn(
              "pl-focus-ring pl-touch group/label flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-start transition-colors hover:bg-fill-3 [&_svg]:size-4 [&_svg]:shrink-0",
              stickyLabel && open && [
                "sticky top-0 z-10 bg-(--pl-sidebar-bg) hover:bg-(--pl-sidebar-bg)",
                "before:pointer-events-none before:absolute before:inset-x-0 before:-top-2 before:h-2 before:bg-(--pl-sidebar-bg)",
              ],
            )}
          >
            {icon && <span className="flex text-fg-muted transition-colors group-hover/label:text-fg">{icon}</span>}
            <span className="min-w-0 truncate text-footnote font-semibold text-fg-muted transition-colors group-hover/label:text-fg">{label}</span>
            {badge}
            <span className="flex-1" />
            {count !== undefined && <span className="pl-tabular text-caption1 text-fg-subtle">{count}</span>}
            <ChevronRightIcon
              aria-hidden="true"
              strokeWidth={2.4}
              className={cn("size-3.5! text-fg-subtle transition-transform duration-(--pl-duration-base) ease-out motion-reduce:transition-none", open && "rotate-90")}
            />
          </button>
        ) : (
          <p
            className={cn(
              "flex h-7 items-center gap-2 px-2.5 text-footnote font-semibold text-fg-muted [&_svg]:size-4 [&_svg]:shrink-0",
              variant === "card" && "h-6",
              collapsed && "sr-only",
            )}
          >
            {icon}
            {label}
            {badge}
            {count !== undefined && <span className="ms-auto pl-tabular text-caption1 font-normal text-fg-subtle">{count}</span>}
          </p>
        ))}
      {/* Folding animates the row track from 0fr to 1fr; the closed list is inert, so it leaves the tab order. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-(--pl-duration-base) ease-out motion-reduce:transition-none",
          shown ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <ul id={listId} inert={!shown} className="flex min-h-0 flex-col gap-0.5 overflow-hidden">
          <GroupMatchContext.Provider value={groupMatch}>{children}</GroupMatchContext.Provider>
        </ul>
      </div>
    </div>
  );
}

const itemVariants = cva(
  [
    "pl-focus-ring pl-touch group/item flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-[0.625rem] px-2.5 text-start text-subhead",
    "transition-colors duration-(--pl-duration-instant) [&_svg]:size-[1.125rem] [&_svg]:shrink-0",
  ],
  {
    variants: {
      active: { true: "font-semibold", false: "text-fg hover:bg-fill-2 active:bg-fill" },
      selection: { soft: "", filled: "" },
      collapsed: { true: "mx-auto size-10 justify-center px-0 [&_svg]:size-5", false: "" },
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
  /** Text the filter matches against when the children are not a plain string (e.g. with asChild). */
  textValue?: string;
};

export function SidebarItem({ className, asChild, icon, active = false, badge, textValue, children, onClick, ...props }: SidebarItemProps) {
  const { collapsed, selection, drawer, close, query } = useContext(SidebarContext);
  const groupMatch = useContext(GroupMatchContext);
  const Comp = asChild ? Slot.Root : "button";
  const text = textValue ?? textOf(children);
  const match = !query || groupMatch || fold(text).includes(fold(query));
  return (
    <li hidden={!match} data-sidebar-match={(query && match) || undefined}>
      <Comp
        {...(!asChild && { type: "button" as const })}
        aria-current={active ? "page" : undefined}
        title={collapsed && text ? text : undefined}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (drawer) close();
        }}
        className={cn(itemVariants({ active, selection, collapsed }), className)}
        {...props}
      >
        {icon}
        <Slot.Slottable>{asChild ? children : <span className={cn("min-w-0 flex-1 truncate", collapsed && "sr-only")}>{children}</span>}</Slot.Slottable>
        {badge && !collapsed && (
          <span className="ms-auto shrink-0 text-subhead text-fg-muted pl-tabular group-aria-[current=page]/item:text-current group-aria-[current=page]/item:opacity-80">
            {badge}
          </span>
        )}
      </Comp>
    </li>
  );
}
