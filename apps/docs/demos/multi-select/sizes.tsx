import type { ComboboxOption } from "pleate/combobox";
import { MultiSelect } from "pleate/multi-select";

const CITIES: ComboboxOption[] = ["Lisbon", "Seville", "Naples", "Kyoto", "Hanoi", "Oaxaca"].map((l) => ({ value: l.toLowerCase(), label: l }));

export default function Demo() {
  return (
    <div className="mx-auto grid w-full max-w-sm gap-3">
      <MultiSelect aria-label="Small" size="sm" options={CITIES} defaultValue={["lisbon", "kyoto"]} />
      <MultiSelect aria-label="Medium" options={CITIES} defaultValue={["lisbon", "kyoto", "hanoi", "oaxaca"]} />
      <MultiSelect aria-label="Large" size="lg" options={CITIES} placeholder="Stops" />
      <MultiSelect aria-label="Stops" invalid options={CITIES} placeholder="Pick at least one stop" />
      <MultiSelect aria-label="Disabled" disabled options={CITIES} defaultValue={["naples"]} />
    </div>
  );
}
