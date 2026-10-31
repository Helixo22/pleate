"use client";

import { CalendarDays, Coffee, List, Map, ParkingCircle, Waves, Wifi } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "pleate/toggle-group";
import { useState } from "react";

export default function Demo() {
  const [view, setView] = useState("list");
  const [amenities, setAmenities] = useState(["wifi", "breakfast"]);
  return (
    <div className="grid justify-items-start gap-5">
      <ToggleGroup type="single" aria-label="View" value={view} onValueChange={(v) => v && setView(v)}>
        <ToggleGroupItem value="list" icon={<List />}>List</ToggleGroupItem>
        <ToggleGroupItem value="map" icon={<Map />}>Map</ToggleGroupItem>
        <ToggleGroupItem value="calendar" icon={<CalendarDays />}>Calendar</ToggleGroupItem>
      </ToggleGroup>

      <div className="flex items-center gap-3">
        <ToggleGroup type="multiple" size="sm" aria-label="Amenities" value={amenities} onValueChange={setAmenities}>
          <ToggleGroupItem value="wifi" icon={<Wifi />} aria-label="Wifi" />
          <ToggleGroupItem value="breakfast" icon={<Coffee />} aria-label="Breakfast" />
          <ToggleGroupItem value="pool" icon={<Waves />} aria-label="Pool" />
          <ToggleGroupItem value="parking" icon={<ParkingCircle />} aria-label="Parking" />
        </ToggleGroup>
        <span className="font-mono text-caption1 text-fg-subtle">{amenities.length} selected</span>
      </div>
    </div>
  );
}
