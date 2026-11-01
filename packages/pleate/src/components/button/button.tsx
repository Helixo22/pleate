// Button: an iOS capsule (squared on request) with six looks (filled, tinted, gray, surface, outline, plain) in four tones, five
// sizes and an icon-only mode (see IconButton). Presses scale down slightly; `loading` keeps the width and shows a
// spinner. `asChild` renders the styles on your own element (a Next <Link>, an <a>…).
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "../../lib/cn.ts";
import { Spinner } from "../spinner/spinner.tsx";

export const buttonVariants = cva(
  [
    "pl-touch pl-focus-ring pl-hit relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap font-semibold",
    "transition-[background-color,color,box-shadow,opacity,scale] duration-(--pl-duration-fast) ease-out",
    "motion-safe:active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='opacity-'])]:opacity-85",
  ],
  {
    variants: {
      variant: {
        filled: "pl-lift",
        tinted: "",
        gray: "bg-fill-2 hover:bg-fill",
        surface: "pl-field bg-surface hover:bg-surface-2",
        outline: "pl-field bg-transparent hover:bg-fill-3",
        plain: "bg-transparent hover:bg-fill-3",
      },
      tone: {
        accent: "",
        neutral: "",
        danger: "",
        success: "",
      },
      size: {
        xs: "h-7 gap-1 px-2 text-footnote [&_svg]:size-3.5",
        sm: "h-8 gap-1.5 px-3 text-footnote [&_svg]:size-4",
        md: "h-9 gap-2 px-3.5 text-subhead [&_svg]:size-4",
        lg: "h-11 gap-2 px-5 text-callout [&_svg]:size-[1.125rem]",
        xl: "h-12 gap-2.5 px-6 text-headline [&_svg]:size-5",
      },
      shape: {
        pill: "rounded-full",
        rounded: "",
      },
      iconOnly: {
        true: "px-0",
        false: "",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      { variant: "filled", tone: "accent", className: "bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-active" },
      { variant: "filled", tone: "neutral", className: "bg-fg text-bg hover:bg-[color-mix(in_oklab,var(--pl-fg)_88%,var(--pl-bg))]" },
      { variant: "filled", tone: "danger", className: "bg-danger text-on-status hover:bg-[color-mix(in_oklab,var(--pl-danger)_88%,var(--pl-mix))]" },
      { variant: "filled", tone: "success", className: "bg-success text-on-status hover:bg-[color-mix(in_oklab,var(--pl-success)_88%,var(--pl-mix))]" },
      { variant: "tinted", tone: "accent", className: "bg-accent-soft text-accent-ink hover:bg-accent-soft-hover" },
      { variant: "tinted", tone: "neutral", className: "bg-fill-2 text-fg hover:bg-fill" },
      { variant: "tinted", tone: "danger", className: "bg-danger-soft text-danger-ink hover:bg-[color-mix(in_oklab,var(--pl-danger-ink)_19%,transparent)]" },
      { variant: "tinted", tone: "success", className: "bg-success-soft text-success-ink hover:bg-[color-mix(in_oklab,var(--pl-success-ink)_20%,transparent)]" },
      { variant: ["gray", "surface", "outline", "plain"], tone: "accent", className: "text-accent-ink" },
      { variant: ["gray", "surface", "outline", "plain"], tone: "neutral", className: "text-fg" },
      { variant: ["gray", "surface", "outline", "plain"], tone: "danger", className: "text-danger-ink" },
      { variant: ["gray", "surface", "outline", "plain"], tone: "success", className: "text-success-ink" },
      { shape: "rounded", size: ["xs", "sm"], className: "rounded-sm" },
      { shape: "rounded", size: ["md", "lg"], className: "rounded-md" },
      { shape: "rounded", size: "xl", className: "rounded-lg" },
      { iconOnly: true, size: "xs", className: "w-7" },
      { iconOnly: true, size: "sm", className: "w-8" },
      { iconOnly: true, size: "md", className: "w-9" },
      { iconOnly: true, size: "lg", className: "w-11 [&_svg]:size-5" },
      { iconOnly: true, size: "xl", className: "w-12 [&_svg]:size-5" },
    ],
    defaultVariants: {
      variant: "filled",
      tone: "accent",
      size: "md",
      shape: "pill",
      iconOnly: false,
      fullWidth: false,
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<ButtonVariantProps, "iconOnly"> & {
    ref?: Ref<HTMLButtonElement>;
    /** Render the styles on the single child element instead of a <button>. */
    asChild?: boolean;
    /** Shows a spinner and blocks presses, keeping the button's size. Not available with asChild. */
    loading?: boolean;
    startIcon?: ReactNode;
    endIcon?: ReactNode;
    /** @internal used by IconButton */
    iconOnly?: boolean;
  };

export function Button({
  className,
  variant,
  tone,
  size,
  shape,
  fullWidth,
  iconOnly,
  asChild = false,
  loading = false,
  disabled,
  startIcon,
  endIcon,
  children,
  type,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, tone, size, shape, fullWidth, iconOnly }), className);

  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      type={type ?? "button"}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      {...props}
    >
      <span className={cn("inline-flex items-center justify-center gap-[inherit]", loading && "invisible")}>
        {startIcon}
        {children}
        {endIcon}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner size={size === "xs" || size === "sm" ? "sm" : "md"} label={null} />
        </span>
      )}
    </button>
  );
}
