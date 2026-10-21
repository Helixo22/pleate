"use client";

import { Mountain, Palmtree, Building2, Utensils } from "lucide-react";
import { Tag } from "pleate/tag";
import { useState } from "react";

const FILTERS = [
  { id: "beach", label: "Beach", icon: <Palmtree /> },
  { id: "mountain", label: "Mountains", icon: <Mountain /> },
  { id: "city", label: "City", icon: <Building2 /> },
  { id: "food", label: "Food", icon: <Utensils /> },
];

export default function Demo() {
  const [active, setActive] = useState<string[]>(["beach"]);
  const [tags, setTags] = useState(["Lisbon", "Weekend", "Under €500"]);
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filters">
        {FILTERS.map((f) => (
          <Tag
            key={f.id}
            icon={f.icon}
            selected={active.includes(f.id)}
            onClick={() => setActive((a) => (a.includes(f.id) ? a.filter((x) => x !== f.id) : [...a, f.id]))}
          >
            {f.label}
          </Tag>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Tag key={tag} variant="accent" onRemove={() => setTags((t) => t.filter((x) => x !== tag))}>
            {tag}
          </Tag>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tag size="sm">Small</Tag>
        <Tag variant="outline">Outline</Tag>
        <Tag variant="surface">Surface</Tag>
        <Tag size="lg" variant="accent">Large</Tag>
      </div>
    </div>
  );
}
