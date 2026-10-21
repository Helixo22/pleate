// Container: centers content with a max width and side gutters that respect the iPhone safe areas.
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { HTMLAttributes, Ref } from "react";
import { cn } from "../../lib/cn.ts";

export const containerVariants = cva("mx-auto w-full", {
  variants: {
    size: {
      sm: "max-w-2xl",
      md: "max-w-3xl",
      lg: "max-w-5xl",
      xl: "max-w-7xl",
      "2xl": "max-w-[90rem]",
      full: "max-w-none",
    },
    gutter: {
      none: "",
      sm: "ps-[max(0.75rem,var(--pl-safe-left))] pe-[max(0.75rem,var(--pl-safe-right))]",
      md: "ps-[max(1rem,var(--pl-safe-left))] pe-[max(1rem,var(--pl-safe-right))] md:px-6 lg:px-8",
      lg: "ps-[max(1.25rem,var(--pl-safe-left))] pe-[max(1.25rem,var(--pl-safe-right))] md:px-10 lg:px-12",
    },
  },
  defaultVariants: { size: "xl", gutter: "md" },
});

export type ContainerProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof containerVariants> & { ref?: Ref<HTMLDivElement>; asChild?: boolean };

export function Container({ className, size, gutter, asChild, ...props }: ContainerProps) {
  const Comp = asChild ? Slot.Root : "div";
  return <Comp className={cn(containerVariants({ size, gutter }), className)} {...props} />;
}
