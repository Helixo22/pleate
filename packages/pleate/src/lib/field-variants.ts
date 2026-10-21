// Shared look of text fields (Input, Textarea, Select trigger, SearchBar): filled iOS well, outlined box or a white
// surface for gray grouped pages. Invalid fields get a red edge; on phones the text stays ≥16px so iOS won't zoom.
import { cva, type VariantProps } from "class-variance-authority";

export const fieldVariants = cva(
  [
    "pl-focus-within-ring relative flex w-full items-center text-fg",
    "transition-[background-color,box-shadow,outline-color] duration-(--pl-duration-fast) ease-ios",
    "has-[[aria-invalid=true]]:shadow-[inset_0_0_0_1.5px_var(--pl-danger-ink)]",
    "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
  ],
  {
    variants: {
      variant: {
        filled: "bg-fill-2 hover:bg-[color-mix(in_oklab,var(--pl-fill-2)_70%,var(--pl-fill))]",
        outline: "bg-surface shadow-[inset_0_0_0_1px_var(--pl-border)]",
        surface: "bg-surface shadow-xs",
      },
      size: {
        sm: "min-h-9 gap-2 rounded-md px-3 text-callout md:text-subhead [&_svg]:size-4",
        md: "min-h-11 gap-2 rounded-lg px-3.5 text-body [&_svg]:size-[1.125rem]",
        lg: "min-h-13 gap-2.5 rounded-xl px-4 text-body [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "filled", size: "md" },
  },
);

export type FieldVariantProps = VariantProps<typeof fieldVariants>;

export const fieldControl =
  "min-w-0 flex-1 self-stretch bg-transparent outline-none placeholder:text-fg-subtle disabled:cursor-not-allowed";
