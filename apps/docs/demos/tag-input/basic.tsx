"use client";

import { TagInput } from "pleate/tag-input";
import { useState } from "react";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Demo() {
  const [stops, setStops] = useState(["Lisbon", "Sintra"]);
  return (
    <div className="mx-auto grid w-full max-w-md gap-6">
      <div className="grid gap-1.5">
        <label htmlFor="stops" className="px-1 text-footnote font-medium text-fg-muted">
          Stops ({stops.length}/5)
        </label>
        <TagInput id="stops" value={stops} onValueChange={setStops} max={5} placeholder="Add a city and press Enter" />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="invite" className="px-1 text-footnote font-medium text-fg-muted">
          Invite travellers
        </label>
        <TagInput
          id="invite"
          variant="outline"
          defaultValue={["marta@plate.app"]}
          placeholder="Emails, separated by commas"
          validate={(v) => EMAIL.test(v) || `${v} is not an email address`}
        />
      </div>
    </div>
  );
}
