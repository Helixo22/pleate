// Combobox: a text field with a filterable listbox (autocomplete). Options are data, with optional groups,
// descriptions and icons; filtering is client side by default (swap `filter`, or pass `filter={false}` and fetch
// from `onInputChange`). Keyboard: arrows, Home/End, Enter, Escape. Built on Radix Popover with the ARIA combobox
// pattern (focus stays in the input).
"use client";

import { ComboboxBase, defaultFilter, filterOptions, type ComboboxBaseProps, type ComboboxOption } from "../../lib/combobox-base.tsx";

export { defaultFilter, filterOptions, type ComboboxOption };

export type ComboboxProps = ComboboxBaseProps & {
  /** Selected option value; `null` for none. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
};

export function Combobox(props: ComboboxProps) {
  return <ComboboxBase {...props} />;
}
