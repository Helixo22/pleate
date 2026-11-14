// MultiSelect: Combobox with several values shown as removable chips (Tag) inside the field. Backspace on an empty
// input removes the last chip; `max` caps the count, `selectAll` adds a first row that toggles every visible option.
"use client";

import { ComboboxBase, type ComboboxBaseProps } from "../../lib/combobox-base.tsx";

export type MultiSelectProps = ComboboxBaseProps & {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Most values that can be chosen; the rest of the options are disabled. */
  max?: number;
  /** Label of a first row that selects or clears all options (hidden while searching or with `max`). */
  selectAll?: string;
};

export function MultiSelect(props: MultiSelectProps) {
  return <ComboboxBase {...props} multiple />;
}
