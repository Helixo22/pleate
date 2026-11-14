"use client";

import { useState } from "react";
import type { ComboboxOption } from "pleate/combobox";
import { MultiSelect } from "pleate/multi-select";

const TRAVELLERS: ComboboxOption[] = [
  { value: "marta", label: "Marta Rossi", description: "Organiser" },
  { value: "joao", label: "Joao Pires" },
  { value: "ines", label: "Ines Duarte" },
  { value: "tomas", label: "Tomas Vidal" },
  { value: "sara", label: "Sara Lindqvist" },
  { value: "kenji", label: "Kenji Mori", disabled: true, description: "Invite pending" },
];

export default function Demo() {
  const [who, setWho] = useState<string[]>(["marta", "joao"]);
  return (
    <div className="mx-auto grid w-full max-w-sm gap-3">
      <MultiSelect aria-label="Travellers" options={TRAVELLERS} value={who} onValueChange={setWho} placeholder="Add travellers" selectAll="All travellers" clearable />
      <MultiSelect aria-label="Travellers, max 3" variant="outline" max={3} defaultValue={["ines"]} options={TRAVELLERS} placeholder="Up to 3 travellers" />
    </div>
  );
}
