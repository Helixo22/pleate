// Input: a text field with optional start and end adornments (icons, units, buttons). `className` styles the field
// box, `inputClassName` the <input>; the ref points at the <input>.
import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "../../lib/cn.ts";
import { fieldControl, fieldVariants, type FieldVariantProps } from "../../lib/field-variants.ts";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> &
  FieldVariantProps & {
    ref?: Ref<HTMLInputElement>;
    startAdornment?: ReactNode;
    endAdornment?: ReactNode;
    inputClassName?: string;
    /** Shorthand for aria-invalid. */
    invalid?: boolean;
  };

export function Input({
  className,
  inputClassName,
  variant,
  size,
  startAdornment,
  endAdornment,
  invalid,
  type = "text",
  ...props
}: InputProps) {
  return (
    <div className={cn(fieldVariants({ variant, size }), className)} data-slot="field">
      {startAdornment && <span className="flex shrink-0 items-center text-fg-muted">{startAdornment}</span>}
      <input
        type={type}
        aria-invalid={invalid || props["aria-invalid"] || undefined}
        className={cn(fieldControl, "[&::-webkit-search-cancel-button]:appearance-none", inputClassName)}
        {...props}
      />
      {endAdornment && <span className="flex shrink-0 items-center text-fg-muted">{endAdornment}</span>}
    </div>
  );
}
