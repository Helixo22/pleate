import { CardStack } from "pleate/effects/depth";

const DAYS = [
  { day: "Day 1", city: "Lisbon", plan: "Land 10:40, tram 28 to Alfama, dinner in Mouraria.", km: "0 km" },
  { day: "Day 2", city: "Sintra", plan: "Train at 08:45, Pena Palace before the crowds, back by 18:00.", km: "28 km" },
  { day: "Day 3", city: "Porto", plan: "Alfa Pendular at 09:09, Ribeira walk, cellars across the river.", km: "313 km" },
  { day: "Day 4", city: "Douro", plan: "Boat up the valley, lunch at a quinta, last train home.", km: "120 km" },
];

export default function Demo() {
  return (
    <CardStack className="w-full max-w-xl" top={88}>
      {DAYS.map((d) => (
        <article key={d.day} className="pl-field flex h-56 flex-col justify-between rounded-xl bg-surface p-6 [--pl-field-border:var(--pl-separator)]">
          <div className="flex justify-between font-mono text-caption1 text-fg-subtle">
            <span>{d.day}</span>
            <span>{d.km}</span>
          </div>
          <div>
            <h3 className="text-title1">{d.city}</h3>
            <p className="mt-1 text-subhead text-fg-muted">{d.plan}</p>
          </div>
        </article>
      ))}
    </CardStack>
  );
}
