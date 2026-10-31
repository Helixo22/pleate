import { Carousel3D } from "pleate/effects/depth";

const CITIES = [
  { city: "Lisbon", country: "Portugal", coord: "38.72 N · 9.14 W", price: "€142" },
  { city: "Kyoto", country: "Japan", coord: "35.01 N · 135.77 E", price: "¥18,400" },
  { city: "Naples", country: "Italy", coord: "40.85 N · 14.27 E", price: "€118" },
  { city: "Oaxaca", country: "Mexico", coord: "17.07 N · 96.73 W", price: "$96" },
  { city: "Reykjavík", country: "Iceland", coord: "64.15 N · 21.94 W", price: "kr 21,900" },
  { city: "Tbilisi", country: "Georgia", coord: "41.72 N · 44.79 E", price: "₾ 210" },
];

export default function Demo() {
  return (
    <Carousel3D
      label="Destinations"
      itemWidth={200}
      itemHeight={250}
      items={CITIES.map((c) => (
        <article key={c.city} className="pl-field flex h-full flex-col justify-between rounded-xl bg-surface p-5 [--pl-field-border:var(--pl-separator)]">
          <span className="font-mono text-caption1 text-fg-subtle">{c.coord}</span>
          <div>
            <h3 className="text-title2">{c.city}</h3>
            <p className="text-subhead text-fg-muted">{c.country}</p>
          </div>
          <p className="text-footnote text-fg-muted">
            from <span className="font-mono text-fg">{c.price}</span> a night
          </p>
        </article>
      ))}
    />
  );
}
