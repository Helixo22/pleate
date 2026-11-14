// InputGroup: an Input with attached boxes: text ("https://", ".com", "€"), icons, a Button or a Select on either side.
// Everything shares one border, one radius and one focus ring (the group draws it when any part is focused).
// Compose InputGroupAddon (text or icon), InputGroupInput, InputGroupButton and, for a Select, give its
// SelectTrigger `variant="plain"` and `className={inputGroupSlot}`. Use Input's own startAdornment for a plain icon.
"use client";

import { createContext, useContext, type ComponentProps } from "react";
import { cn } from "../../lib/cn.ts";
import { fieldControl, fieldVariants, type FieldVariantProps } from "../../lib/field-variants.ts";
import { Button } from "../button/button.tsx";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
const SizeContext = createContext<Size>("md");

const px: Record<Size, string> = { xs: "px-2", sm: "px-2.5", md: "px-3", lg: "px-3.5", xl: "px-4" };
const buttonSize = { xs: "xs", sm: "sm", md: "md", lg: "lg", xl: "xl" } as const;

/** Class for a custom child (e.g. a SelectTrigger) so it sits flush in the group with a hairline divider. */
export const inputGroupSlot =
  "w-auto! self-stretch rounded-none! border-s border-separator first:border-s-0 px-3! outline-offset-[-2px] [box-shadow:none]! hover:bg-fill-3";

export type InputGroupProps = ComponentProps<"div"> & Omit<FieldVariantProps, "size"> & { size?: Size; invalid?: boolean };

export function InputGroup({ className, variant, size = "md", invalid, ...props }: InputGroupProps) {
  const s = size ?? "md";
  return (
    <SizeContext.Provider value={s}>
      <div
        role="group"
        data-slot="field"
        aria-invalid={invalid || undefined}
        className={cn(fieldVariants({ variant, size }), "gap-0 overflow-hidden px-0", invalid && "[--pl-field-border:var(--pl-danger-ink)]", className)}
        {...props}
      />
    </SizeContext.Provider>
  );
}

export function InputGroupInput({ className, type = "text", ...props }: ComponentProps<"input">) {
  const s = useContext(SizeContext);
  return <input type={type} className={cn(fieldControl, px[s], className)} {...props} />;
}

/** Text or an icon next to the input. `bare` drops the tinted well, for a plain icon. */
export function InputGroupAddon({ className, bare, ...props }: ComponentProps<"span"> & { bare?: boolean }) {
  const s = useContext(SizeContext);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center self-stretch whitespace-nowrap text-fg-muted",
        px[s],
        !bare && "bg-fill-3 border-separator [&:first-child]:border-e [&:last-child]:border-s",
        bare && "[&:first-child]:pe-0 [&:last-child]:ps-0",
        className,
      )}
      {...props}
    />
  );
}

/** A Button attached to the input, flush with the group edge. */
export function InputGroupButton({ className, variant = "plain", ...props }: ComponentProps<typeof Button>) {
  const s = useContext(SizeContext);
  return (
    <Button
      variant={variant}
      size={buttonSize[s]}
      className={cn("h-auto self-stretch rounded-none! border-separator outline-offset-[-2px] [&:first-child]:border-e [&:last-child]:border-s", className)}
      {...props}
    />
  );
}
