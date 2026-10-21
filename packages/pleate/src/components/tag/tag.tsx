// Tag: a chip for keywords and filters. Static, selectable (a toggle button with aria-pressed, e.g. filter chips)
// or removable (a trailing × with its own accessible name).
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, MouseEvent, ReactNode, Ref } from "react";
import { cn } from "../../lib/cn.ts";
import { XIcon } from "../../lib/icons.tsx";

export const tagVariants = cva(
  [
    "pl-touch inline-flex max-w-full shrink-0 items-center rounded-full font-medium whitespace-nowrap",
    "transition-[background-color,color,box-shadow,scale] duration-(--pl-duration-fast) ease-ios",
  ],
  {
    variants: {
      variant: {
        soft: "bg-fill-2 text-fg",
        outline: "bg-transparent text-fg shadow-[inset_0_0_0_1px_var(--pl-border)]",
        surface: "bg-surface text-fg shadow-xs",
        accent: "bg-accent-soft text-accent-ink",
      },
      size: {
        sm: "h-7 gap-1 px-2.5 text-footnote [&_svg]:size-3.5",
        md: "h-8 gap-1.5 px-3 text-subhead [&_svg]:size-4",
        lg: "h-10 gap-2 px-4 text-callout [&_svg]:size-[1.125rem]",
      },
      selected: {
        true: "bg-accent text-on-accent shadow-none",
        false: "",
      },
      interactive: {
        true: "pl-focus-ring cursor-pointer motion-safe:active:scale-[0.96]",
        false: "",
      },
    },
    compoundVariants: [
      { interactive: true, selected: false, variant: ["soft", "outline", "surface"], className: "hover:bg-fill" },
      { interactive: true, selected: false, variant: "accent", className: "hover:bg-accent-soft-hover" },
      { interactive: true, selected: true, className: "hover:bg-accent-hover" },
    ],
    defaultVariants: { variant: "soft", size: "md", selected: false, interactive: false },
  },
);

type TagBaseProps = Omit<VariantProps<typeof tagVariants>, "interactive"> & {
  icon?: ReactNode;
  /** Shows a remove button; `removeLabel` names it for screen readers. */
  onRemove?: () => void;
  removeLabel?: string;
};

export type TagProps = TagBaseProps &
  Omit<HTMLAttributes<HTMLElement>, "onClick"> & {
    ref?: Ref<HTMLElement>;
    /** Makes the tag a toggle button (with `selected` for its state). */
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
  };

export function Tag({
  className,
  variant,
  size,
  selected,
  icon,
  onRemove,
  removeLabel,
  onClick,
  disabled,
  children,
  ref,
  ...props
}: TagProps) {
  const interactive = Boolean(onClick);
  const classes = cn(
    tagVariants({ variant, size, selected: Boolean(selected), interactive }),
    onRemove && "pe-1",
    disabled && "pointer-events-none opacity-50",
    className,
  );
  const content = (
    <>
      {icon}
      <span className="truncate">{children}</span>
    </>
  );
  const remove = onRemove && (
    <button
      type="button"
      disabled={disabled}
      aria-label={removeLabel ?? `Remove ${typeof children === "string" ? children : "tag"}`}
      onClick={(event) => {
        event.stopPropagation();
        onRemove();
      }}
      className="pl-focus-ring grid size-6 shrink-0 cursor-pointer place-items-center rounded-full opacity-60 transition-opacity hover:bg-fill hover:opacity-100 [&_svg]:size-3.5"
    >
      <XIcon strokeWidth={2.5} />
    </button>
  );

  if (interactive) {
    // A removable toggle needs two separate buttons, so the outer element stays a plain container.
    if (remove) {
      return (
        <span ref={ref as Ref<HTMLSpanElement>} className={classes} {...props}>
          <button
            type="button"
            aria-pressed={selected ?? undefined}
            disabled={disabled}
            onClick={onClick}
            className="pl-focus-ring inline-flex cursor-pointer items-center gap-[inherit] rounded-full"
          >
            {content}
          </button>
          {remove}
        </span>
      );
    }
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        aria-pressed={selected ?? undefined}
        disabled={disabled}
        onClick={onClick}
        className={classes}
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <span ref={ref as Ref<HTMLSpanElement>} className={classes} {...props}>
      {content}
      {remove}
    </span>
  );
}
