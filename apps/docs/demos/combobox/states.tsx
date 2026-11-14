"use client";

import { useEffect, useState } from "react";
import { Combobox, type ComboboxOption } from "pleate/combobox";

const ALL: ComboboxOption[] = ["Alba", "Albufeira", "Alicante", "Almeria", "Amalfi", "Amsterdam", "Annecy", "Antwerp"].map((l) => ({
  value: l.toLowerCase(),
  label: l,
}));

export default function Demo() {
  const [results, setResults] = useState<ComboboxOption[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  // Stands in for a request to a places API.
  useEffect(() => {
    if (!query) return setResults([]);
    setLoading(true);
    const t = setTimeout(() => {
      setResults(ALL.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())));
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="mx-auto grid w-full max-w-sm gap-3">
      <Combobox aria-label="Search places" options={results} filter={false} loading={loading} onInputChange={setQuery} placeholder="Search places (async)" emptyText={query ? "No places match" : "Type a city name"} />
      <Combobox aria-label="Small" size="sm" options={ALL} placeholder="Small" />
      <Combobox aria-label="Large" size="lg" options={ALL} placeholder="Large" />
      <Combobox aria-label="Hotel" invalid options={ALL} defaultValue="amalfi" />
      <Combobox aria-label="Disabled" disabled options={ALL} defaultValue="annecy" />
    </div>
  );
}
