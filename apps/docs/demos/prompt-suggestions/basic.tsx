"use client";

import { Briefcase, Map, Sun, Wallet } from "lucide-react";
import { PromptSuggestions } from "pleate/ai/prompt-suggestions";
import { toast } from "pleate/toast";

const ITEMS = [
  { icon: <Map />, title: "Plan a weekend", description: "Two days, one city", prompt: "Plan a weekend in a European city" },
  { icon: <Sun />, title: "Warm in winter", description: "Under 4 hours of flight", prompt: "Where is it warm in January within 4 hours of Milan?" },
  { icon: <Wallet />, title: "Budget check", description: "Is €800 enough for Japan?", prompt: "Is €800 enough for a week in Japan?" },
  { icon: <Briefcase />, title: "Packing list", description: "Carry-on only", prompt: "Make a carry-on packing list for 5 days" },
];

export default function Demo() {
  const pick = (prompt: string) => toast(prompt);
  return (
    <div className="grid w-full gap-8">
      <PromptSuggestions suggestions={ITEMS} onSelect={pick} />
      <PromptSuggestions suggestions={ITEMS} onSelect={pick} variant="chips" />
    </div>
  );
}
