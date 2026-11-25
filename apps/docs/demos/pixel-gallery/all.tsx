"use client";

import { PixelArt } from "pleate/effects/pixel-art";
import { pixelCategories, pixelDrawings, type PixelCategory } from "pleate/effects/pixel-gallery";
import { SearchBar } from "pleate/search-bar";
import { SegmentedControl } from "pleate/segmented-control";
import { toast } from "pleate/toast";
import { useState } from "react";

type Filter = "all" | PixelCategory;

const FILTERS = (["all", ...pixelCategories] as Filter[]).map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }));

export default function Demo() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const shown = pixelDrawings.filter((d) => (filter === "all" || d.category === filter) && d.name.toLowerCase().includes(query.trim().toLowerCase()));

  const copy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(`<PixelArt art={pixelDrawing("${id}")} />`);
      toast.success("Copied the code");
    } catch {
      toast.error("The browser did not allow copying");
    }
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl aria-label="Category" value={filter} onValueChange={setFilter} options={FILTERS} />
        <SearchBar placeholder="Search drawings" onValueChange={setQuery} className="sm:max-w-56" />
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
        {shown.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => void copy(d.id)}
              aria-label={`Copy the code for ${d.name}`}
              className="pl-focus-ring flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl p-3 transition-colors hover:bg-fill-2"
            >
              <PixelArt art={d} className="size-16" />
              <span className="text-caption1 text-fg-muted">{d.name}</span>
            </button>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="py-8 text-center text-subhead text-fg-muted">No drawing matches that search.</p>}
    </div>
  );
}
