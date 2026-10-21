"use client";

import { Checkbox } from "pleate/checkbox";
import { useState } from "react";

const ITEMS = ["Passport", "Chargers", "Sunscreen"];

export default function Demo() {
  const [checked, setChecked] = useState<string[]>(["Passport"]);
  const all = checked.length === ITEMS.length ? true : checked.length ? "indeterminate" : false;
  return (
    <div className="grid gap-4">
      <Checkbox
        label="Packing list"
        checked={all}
        onCheckedChange={(value) => setChecked(value === true ? ITEMS : [])}
      />
      <div className="grid gap-3 ps-8">
        {ITEMS.map((item) => (
          <Checkbox
            key={item}
            label={item}
            checked={checked.includes(item)}
            onCheckedChange={(value) =>
              setChecked((list) => (value === true ? [...list, item] : list.filter((i) => i !== item)))
            }
          />
        ))}
      </div>
    </div>
  );
}
