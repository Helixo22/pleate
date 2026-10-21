import { Compass, Map, Plane, Sun, Utensils, Wallet } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "pleate/effects/reveal";

const ITEMS = [
  { icon: <Map />, title: "Itineraries" },
  { icon: <Plane />, title: "Flights" },
  { icon: <Utensils />, title: "Food" },
  { icon: <Wallet />, title: "Budgets" },
  { icon: <Sun />, title: "Weather" },
  { icon: <Compass />, title: "Discover" },
];

export default function Demo() {
  return (
    <div className="grid w-full gap-12">
      <div className="grid gap-4 sm:grid-cols-3">
        {(["up", "zoom", "blur"] as const).map((effect, i) => (
          <Reveal key={effect} effect={effect} delay={i * 0.1} className="grid h-28 place-items-center rounded-2xl bg-accent-soft text-headline text-accent-ink capitalize">
            {effect}
          </Reveal>
        ))}
      </div>
      <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3" stagger={0.07}>
        {ITEMS.map((item) => (
          <RevealItem key={item.title} className="flex items-center gap-3 rounded-2xl bg-fill-3 p-4">
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-on-accent [&_svg]:size-5">{item.icon}</span>
            <span className="text-headline">{item.title}</span>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}
