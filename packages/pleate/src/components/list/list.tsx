// List: the iOS Settings list. ListSection groups rows on a rounded card ("inset") or edge to edge ("plain"), with a
// header and a footer note. ListItem has a colored icon tile, title, subtitle, a trailing value, any control (Switch,
// Badge…) and a chevron when it navigates. Separators start after the icon, like iOS. swipeActions reveal buttons
// when the row is dragged left (or when one of them gets keyboard focus).
"use client";

import { animate, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { Slot } from "radix-ui";
import { createContext, useContext, useState, type ElementType, type HTMLAttributes, type MouseEvent, type ReactNode, type Ref } from "react";
import { cn } from "../../lib/cn.ts";
import { CheckIcon, ChevronRightIcon } from "../../lib/icons.tsx";
import { spring } from "../../motion/tokens.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

const SectionContext = createContext<{ variant: "inset" | "plain" }>({ variant: "inset" });

export function List({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex w-full flex-col gap-8", className)} {...props} />;
}

export type ListSectionProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  header?: ReactNode;
  footer?: ReactNode;
  variant?: "inset" | "plain";
};

export function ListSection({ header, footer, variant = "inset", className, children, ...props }: ListSectionProps) {
  return (
    <SectionContext.Provider value={{ variant }}>
      <section className={cn("flex flex-col", className)} {...props}>
        {header && <h3 className={cn("pb-1.5 text-footnote text-fg-muted", variant === "inset" ? "px-4" : "px-4 md:px-5")}>{header}</h3>}
        <ul role="list" className={cn("overflow-hidden bg-surface", variant === "inset" ? "rounded-xl" : "border-y border-separator")}>
          {children}
        </ul>
        {footer && <p className="px-4 pt-1.5 text-footnote text-fg-muted">{footer}</p>}
      </section>
    </SectionContext.Provider>
  );
}

export type SwipeAction = {
  label: string;
  icon?: ReactNode;
  tone?: "danger" | "warning" | "accent" | "neutral";
  onSelect: () => void;
};

const ACTION_TONE = {
  danger: "bg-danger",
  warning: "bg-warning",
  accent: "bg-accent text-on-accent",
  neutral: "bg-fg-subtle",
} as const;
const ACTION_WIDTH = 76;

export type ListItemProps = Omit<HTMLAttributes<HTMLElement>, "title" | "onClick"> & {
  ref?: Ref<HTMLElement>;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Glyph shown white on a colored tile. */
  icon?: ReactNode;
  /** Tile color (any CSS color, e.g. "var(--pl-info)"). */
  iconColor?: string;
  /** Shows the leading content as-is (an Avatar, a larger image…) instead of a tile. */
  leading?: ReactNode;
  /** Muted text at the end ("On", "Wi-Fi name"). */
  value?: ReactNode;
  /** Any control or badge at the end. */
  trailing?: ReactNode;
  /** Navigation link for the row. */
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Render the row as your own element (e.g. Next <Link>). */
  asChild?: boolean;
  /** Checkmark at the end (single choice lists). */
  selected?: boolean;
  /** Show the chevron (default: when the row navigates). */
  chevron?: boolean;
  tone?: "default" | "danger" | "accent";
  disabled?: boolean;
  swipeActions?: SwipeAction[];
};

export function ListItem({
  title,
  subtitle,
  icon,
  iconColor = "var(--pl-accent)",
  leading,
  value,
  trailing,
  href,
  onClick,
  asChild,
  selected,
  chevron,
  tone = "default",
  disabled,
  swipeActions,
  className,
  children,
  ...props
}: ListItemProps) {
  const { variant } = useContext(SectionContext);
  const interactive = Boolean(href || onClick || asChild);
  const showChevron = chevron ?? Boolean(href || asChild);
  const lead =
    leading ??
    (icon && (
      <span
        className="grid size-[1.8125rem] shrink-0 place-items-center rounded-[0.4375rem] text-on-status [&_svg]:size-[1.0625rem]"
        style={{ background: iconColor }}
        aria-hidden="true"
      >
        {icon}
      </span>
    ));

  const content = (
    <>
      {lead}
      <span className="flex min-h-11 min-w-0 flex-1 items-center gap-3 py-2.5 pe-4 shadow-[inset_0_-1px_0_var(--pl-separator)] group-last/item:shadow-none">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={cn("truncate text-body", tone === "danger" && "text-danger-ink", tone === "accent" && "text-accent-ink")}>{title}</span>
          {subtitle && <span className="line-clamp-2 text-footnote text-fg-muted">{subtitle}</span>}
        </span>
        {value && <span className="max-w-[45%] shrink-0 truncate text-body text-fg-muted">{value}</span>}
        {trailing && <span className="flex shrink-0 items-center">{trailing}</span>}
        {selected && <CheckIcon className="size-5 shrink-0 text-accent-ink" strokeWidth={2.5} />}
        {showChevron && <ChevronRightIcon className="-me-1 size-[1.125rem] shrink-0 text-fg-subtle rtl:rotate-180" strokeWidth={2.5} />}
      </span>
      {children}
    </>
  );

  const rowClass = cn(
    "flex w-full items-center gap-3 bg-surface ps-4 text-start text-fg",
    variant === "plain" && "md:ps-5",
    interactive && "pl-focus-ring pl-touch cursor-pointer outline-offset-[-2px] transition-colors duration-(--pl-duration-instant) hover:bg-fill-3 active:bg-fill-2",
    disabled && "pointer-events-none opacity-50",
    className,
  );

  const Comp: ElementType = asChild ? Slot.Root : href ? "a" : onClick ? "button" : "div";
  const row = (
    <Comp
      {...(Comp === "button" && { type: "button" as const, disabled })}
      {...(href && !asChild && { href })}
      aria-current={selected ? "true" : undefined}
      onClick={onClick}
      className={rowClass}
      {...props}
    >
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : content}
    </Comp>
  );

  return (
    <li className="group/item relative">
      {swipeActions?.length ? <Swipeable actions={swipeActions}>{row}</Swipeable> : row}
    </li>
  );
}

function Swipeable({ actions, children }: { actions: SwipeAction[]; children: ReactNode }) {
  const x = useMotionValue(0);
  // Actions stay hidden until the row moves, so nothing peeks through the rounded corners.
  const actionsOpacity = useTransform(x, [-8, 0], [1, 0]);
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const width = actions.length * ACTION_WIDTH;

  const snap = (next: boolean) => {
    setOpen(next);
    animate(x, next ? -width : 0, reduced ? { duration: 0 } : spring.snap);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => snap(info.offset.x < -width / 2 || info.velocity.x < -400 ? true : info.velocity.x > 300 ? false : open && info.offset.x < width / 3);

  return (
    <div className="relative overflow-hidden">
      <motion.div className="absolute inset-y-0 end-0 flex" style={{ width, opacity: actionsOpacity }}>
        {actions.map((action, i) => (
          <button
            key={i}
            type="button"
            onFocus={() => snap(true)}
            onBlur={(event) => !event.currentTarget.parentElement?.contains(event.relatedTarget as Node) && snap(false)}
            onClick={() => {
              action.onSelect();
              snap(false);
            }}
            className={cn(
              "pl-focus-ring flex h-full flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-caption1 font-medium text-on-status outline-offset-[-3px] [&_svg]:size-5",
              ACTION_TONE[action.tone ?? "neutral"],
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </motion.div>
      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -width, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.02 }}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        onClickCapture={(event) => {
          // A tap on an open row closes it instead of activating it.
          if (open) {
            event.preventDefault();
            event.stopPropagation();
            snap(false);
          }
        }}
        className="relative touch-pan-y bg-surface"
      >
        {children}
      </motion.div>
    </div>
  );
}
