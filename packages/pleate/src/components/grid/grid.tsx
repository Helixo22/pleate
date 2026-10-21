// Grid: equal columns that can change per breakpoint ({ base: 1, md: 2, lg: 3 }), or an auto-fill grid that fits as
// many columns as `minItemWidth` allows. Gap on Tailwind's spacing scale.
import { Slot } from "radix-ui";
import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { cn } from "../../lib/cn.ts";

const BREAKPOINTS = ["base", "sm", "md", "lg", "xl"] as const;
type Breakpoint = (typeof BREAKPOINTS)[number];
export type ResponsiveColumns = number | Partial<Record<Breakpoint, number>>;

export type GridProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
  asChild?: boolean;
  columns?: ResponsiveColumns;
  /** Auto-fill columns at least this wide (CSS length); overrides `columns`. */
  minItemWidth?: string;
  gap?: number;
  /** Row gap if different from `gap`. */
  rowGap?: number;
};

const repeat = (n: number) => `repeat(${n}, minmax(0, 1fr))`;

export function Grid({ className, style, asChild, columns = 1, minItemWidth, gap = 4, rowGap, ...props }: GridProps) {
  const Comp = asChild ? Slot.Root : "div";
  const vars: Record<string, string> = {};
  if (minItemWidth) {
    vars["--pl-cols-base"] = `repeat(auto-fill, minmax(min(100%, ${minItemWidth}), 1fr))`;
  } else {
    // Each breakpoint inherits the closest smaller one, resolved here so the CSS stays a flat list of variables.
    const map = typeof columns === "number" ? { base: columns } : columns;
    let current = map.base ?? 1;
    for (const bp of BREAKPOINTS) {
      current = map[bp] ?? current;
      vars[`--pl-cols-${bp}`] = repeat(current);
    }
  }
  return (
    <Comp
      className={cn(
        "grid grid-cols-(--pl-cols-base)",
        !minItemWidth && "sm:grid-cols-(--pl-cols-sm) md:grid-cols-(--pl-cols-md) lg:grid-cols-(--pl-cols-lg) xl:grid-cols-(--pl-cols-xl)",
        className,
      )}
      style={
        {
          ...vars,
          columnGap: `calc(var(--spacing) * ${gap})`,
          rowGap: `calc(var(--spacing) * ${rowGap ?? gap})`,
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  );
}
