// Stack: a flex column or row with a gap on Tailwind's spacing scale (gap={4} = 1rem). direction="responsive"
// stacks on phones and lines up from md. HStack / VStack are shorthands.
import { Slot } from "radix-ui";
import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { cn } from "../../lib/cn.ts";

const ALIGN = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch", baseline: "items-baseline" } as const;
const JUSTIFY = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between", around: "justify-around", evenly: "justify-evenly" } as const;
const DIRECTION = { column: "flex-col", row: "flex-row", responsive: "flex-col md:flex-row" } as const;

export type StackProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
  asChild?: boolean;
  direction?: keyof typeof DIRECTION;
  /** Spacing steps (×0.25rem). */
  gap?: number;
  align?: keyof typeof ALIGN;
  justify?: keyof typeof JUSTIFY;
  wrap?: boolean;
  inline?: boolean;
};

export function Stack({
  className,
  style,
  asChild,
  direction = "column",
  gap = 4,
  align,
  justify,
  wrap,
  inline,
  ...props
}: StackProps) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      className={cn(
        inline ? "inline-flex" : "flex",
        DIRECTION[direction],
        align && ALIGN[align],
        justify && JUSTIFY[justify],
        wrap && "flex-wrap",
        className,
      )}
      style={{ gap: `calc(var(--spacing) * ${gap})`, ...style } as CSSProperties}
      {...props}
    />
  );
}

export const HStack = (props: Omit<StackProps, "direction">) => <Stack direction="row" align="center" {...props} />;
export const VStack = (props: Omit<StackProps, "direction">) => <Stack direction="column" {...props} />;
