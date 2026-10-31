"use client";

import { Rating } from "pleate/rating";
import { useState } from "react";

const STAYS = [
  { name: "Alfama flat, Lisbon", score: 4.6, reviews: 212 },
  { name: "River view room, Porto", score: 4.2, reviews: 87 },
];

export default function Demo() {
  const [score, setScore] = useState(0);
  return (
    <div className="grid w-full max-w-sm gap-6">
      <div className="grid gap-2">
        <p className="text-subhead font-medium text-fg">How was your stay?</p>
        <Rating aria-label="Your rating" value={score} onValueChange={setScore} showValue />
      </div>
      <ul className="grid gap-3">
        {STAYS.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-4">
            <span className="text-subhead text-fg">{s.name}</span>
            <span className="flex items-center gap-2">
              <Rating aria-label={s.name} value={s.score} readOnly allowHalf size="sm" showValue />
              <span className="font-mono text-caption1 text-fg-subtle">{s.reviews}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
