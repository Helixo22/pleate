"use client";

import { SearchBar } from "pleate/search-bar";
import { useMemo, useState } from "react";

const CITIES = ["Lisbon", "Kyoto", "Seville", "Naples", "Hanoi", "Reykjavík", "Marrakesh", "Porto", "Valencia", "Oaxaca"];

export default function Demo() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <div className="grid w-full max-w-md gap-6">
      <div className="grid gap-3">
        <SearchBar placeholder="Search cities" onValueChange={setQuery} debounce={120} cancelable shortcut="/" />
        <ul className="flex flex-wrap gap-2" aria-live="polite">
          {results.map((c) => (
            <li key={c} className="rounded-full bg-fill-2 px-3 py-1 text-subhead">{c}</li>
          ))}
          {results.length === 0 && <li className="text-subhead text-fg-muted">No cities match “{query}”.</li>}
        </ul>
      </div>
      <SearchBar size="sm" variant="surface" placeholder="Small, on a surface" shortcut="mod+k" />
      <SearchBar placeholder="Loading…" defaultValue="Lisbon" loading />
    </div>
  );
}
