// Shared look of text fields (Input, Textarea, Select trigger, DatePicker, NumberField): the iOS filled well (default,
// a system fill with no border, like UISearchBar and SwiftUI's rounded fields), a bordered box on a 1px lip
// (outline), a plain surface, or "plain" for a field that sits inside an inset grouped row (no box at all). Focus
// draws an accent edge with a soft halo; invalid fields get a red edge. On phones the text stays 16px so mobile
// Safari won't zoom.
import { cva, type VariantProps } from "class-variance-authority";

export const fieldVariants = cva(
  [
    "pl-field relative flex w-full items-center text-fg",
    "transition-[background-color,box-shadow] duration-(--pl-duration-fast) ease-out",
    "has-[:focus-visible]:[--pl-field-border:var(--pl-accent-ink)] has-[:focus-visible]:shadow-[inset_0_0_0_1px_var(--pl-field-border),0_0_0_3px_var(--pl-accent-soft)]",
    "has-[[aria-invalid=true]]:[--pl-field-border:var(--pl-danger-ink)] has-[[aria-invalid=true]:focus-visible]:shadow-[inset_0_0_0_1px_var(--pl-field-border),0_0_0_3px_var(--pl-danger-soft)]",
    "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
  ],
  {
    variants: {
      variant: {
        filled: "bg-fill-2 [--pl-field-border:transparent] hover:bg-fill",
        outline: "bg-surface [--pl-field-border:var(--pl-border-strong)] hover:[--pl-field-border:var(--pl-fg-muted)]",
        surface: "bg-surface [--pl-field-border:var(--pl-separator)] hover:[--pl-field-border:var(--pl-fg-muted)]",
        plain: "rounded-none! bg-transparent px-0! [--pl-field-border:transparent] [box-shadow:none] has-[:focus-visible]:shadow-none!",
      },
      size: {
        sm: "min-h-8 gap-2 rounded-sm px-2.5 text-[1rem] md:text-footnote [&_svg]:size-3.5",
        md: "min-h-9 gap-2 rounded-md px-3 text-[1rem] md:text-subhead [&_svg]:size-4",
        lg: "min-h-11 gap-2.5 rounded-lg px-3.5 text-[1rem] md:text-callout [&_svg]:size-[1.125rem]",
      },
    },
    defaultVariants: { variant: "filled", size: "md" },
  },
);

export type FieldVariantProps = VariantProps<typeof fieldVariants>;

export const fieldControl =
  "w-0 min-w-0 flex-1 self-stretch bg-transparent outline-none placeholder:text-fg-subtle placeholder:opacity-80 disabled:cursor-not-allowed";
