"use client";

import { Grid2x2, List, Map } from "lucide-react";
import { SegmentedControl } from "pleate/segmented-control";
import { useState } from "react";

export default function Demo() {
  const [range, setRange] = useState("week");
  return (
    <div className="grid w-full max-w-md gap-6">
      <SegmentedControl
        aria-label="Range"
        value={range}
        onValueChange={setRange}
        fullWidth
        options={[
          { value: "day", label: "Day" },
          { value: "week", label: "Week" },
          { value: "month", label: "Month" },
          { value: "year", label: "Year" },
        ]}
      />
      <SegmentedControl
        aria-label="View"
        size="sm"
        options={[
          { value: "list", label: "List", icon: <List /> },
          { value: "grid", label: "Grid", icon: <Grid2x2 /> },
          { value: "map", label: "Map", icon: <Map /> },
        ]}
      />
      <SegmentedControl
        aria-label="Layout"
        size="lg"
        options={[
          { value: "list", label: null, icon: <List />, "aria-label": "List" },
          { value: "grid", label: null, icon: <Grid2x2 />, "aria-label": "Grid" },
        ]}
      />
    </div>
  );
}
