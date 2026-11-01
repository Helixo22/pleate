// Card: a solid rounded surface for grouped content. Compose CardMedia (bleeds to the edges), CardIcon, CardHeader,
// CardTitle, CardDescription, CardContent and CardFooter. `interactive` lifts its fill on hover and presses in; with asChild
// the whole card can be a link. `tint` gives the card its own color: a soft wash from the top corner, a filled CardIcon
// and `text-(--pl-card-tint)` for its call to action.
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { cn } from "../../lib/cn.ts";

export const cardVariants = cva("relative flex flex-col overflow-hidden text-fg [--pl-card-gap:calc(var(--pl-card-p)*0.75)]", {
  variants: {
    variant: {
      elevated: "bg-surface shadow-[var(--pl-edge)]",
      flat: "bg-surface",
      filled: "bg-surface-2",
      outline: "bg-transparent shadow-[inset_0_0_0_1px_var(--pl-separator)]",
      raised: "bg-elevated shadow-lg",
    },
    padding: {
      none: "[--pl-card-p:0px]",
      sm: "[--pl-card-p:1rem]",
      md: "[--pl-card-p:1.25rem] md:[--pl-card-p:1.5rem]",
      lg: "[--pl-card-p:1.5rem] md:[--pl-card-p:2rem]",
    },
    radius: {
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl",
    },
    interactive: {
      true: [
        "pl-focus-ring pl-touch cursor-pointer",
        "transition-[background-color,opacity,scale] duration-200 ease-out",
        "hover:bg-surface-2 motion-safe:active:scale-[0.985] active:opacity-90",
      ],
      false: "",
    },
  },
  defaultVariants: { variant: "elevated", padding: "md", radius: "2xl", interactive: false },
});

export type CardProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants> & {
    ref?: Ref<HTMLDivElement>;
    asChild?: boolean;
    /** The card's own color (any CSS color or token): a wash from the top corner and a filled CardIcon. */
    tint?: string;
  };

export function Card({ className, variant, padding, radius, interactive, asChild, tint, style, ...props }: CardProps) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      data-slot="card"
      className={cn(
        cardVariants({ variant, padding, radius, interactive }),
        "gap-(--pl-card-gap) p-(--pl-card-p)",
        tint && "bg-[linear-gradient(150deg,color-mix(in_srgb,var(--pl-card-tint)_11%,transparent)_0%,transparent_75%)]",
        className,
      )}
      style={tint ? ({ "--pl-card-tint": tint, ...style } as CSSProperties) : style}
      {...props}
    />
  );
}

/** A 44px tile with the card's icon: filled with the card's tint (white glyph), or the accent when it has none. */
export function CardIcon({ className, ...props }: DivProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-[0.75rem] bg-(--pl-card-tint,var(--pl-accent)) text-white [&_svg]:size-[1.3rem]",
        className,
      )}
      {...props}
    />
  );
}

type DivProps = HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> };

/** Image, video or illustration that bleeds to the card's edges (at the top, or anywhere). */
export function CardMedia({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "-mx-(--pl-card-p) overflow-hidden first:-mt-(--pl-card-p) last:-mb-(--pl-card-p) [&>img]:block [&>img]:w-full [&>img]:object-cover",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: DivProps) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement> & { ref?: Ref<HTMLHeadingElement> }) {
  return <h3 className={cn("text-headline text-fg", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement> & { ref?: Ref<HTMLParagraphElement> }) {
  return <p className={cn("text-subhead text-fg-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={cn("flex flex-col gap-3 text-body", className)} {...props} />;
}

export function CardFooter({ className, ...props }: DivProps) {
  return <div className={cn("mt-auto flex flex-wrap items-center gap-2 pt-1", className)} {...props} />;
}
