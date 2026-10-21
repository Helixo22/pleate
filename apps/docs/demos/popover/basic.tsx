"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "pleate/button";
import { Checkbox } from "pleate/checkbox";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "pleate/popover";
import { Slider } from "pleate/slider";

export default function Demo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="gray" startIcon={<SlidersHorizontal />}>Filters</Button>
      </PopoverTrigger>
      <PopoverContent arrow className="grid gap-4">
        <p className="text-headline">Filters</p>
        <div className="grid gap-2">
          <span className="text-subhead text-fg-muted">Max price per night</span>
          <Slider defaultValue={[180]} max={400} thumbLabels={["Max price"]} />
        </div>
        <div className="grid gap-3">
          <Checkbox label="Free cancellation" defaultChecked />
          <Checkbox label="Breakfast included" />
        </div>
        <PopoverClose asChild>
          <Button size="sm">Apply</Button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  );
}
