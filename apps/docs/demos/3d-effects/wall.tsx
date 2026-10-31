import { TiltWall } from "pleate/effects/depth";

const PLACES = [
  ["Lisbon", "PT", "€142"], ["Kyoto", "JP", "¥18,400"], ["Naples", "IT", "€118"], ["Oaxaca", "MX", "$96"],
  ["Reykjavík", "IS", "kr 21,900"], ["Tbilisi", "GE", "₾ 210"], ["Porto", "PT", "€104"], ["Seville", "ES", "€131"],
  ["Hanoi", "VN", "₫ 1.2M"], ["Marrakesh", "MA", "MAD 890"], ["Ljubljana", "SI", "€97"], ["Valparaíso", "CL", "$74"],
  ["Istanbul", "TR", "₺ 3,100"], ["Tallinn", "EE", "€88"], ["Cusco", "PE", "S/ 260"], ["Bergen", "NO", "kr 1,450"],
];

export default function Demo() {
  return (
    <TiltWall
      label="Destinations"
      className="w-full rounded-xl"
      height={440}
      items={PLACES.map(([city, cc, price], i) => (
        <div
          key={city}
          className={
            i % 5 === 0
              ? "flex h-32 flex-col justify-between rounded-lg bg-fg p-4 text-bg"
              : "pl-field flex h-32 flex-col justify-between rounded-lg bg-surface p-4 [--pl-field-border:var(--pl-separator)]"
          }
        >
          <span className="font-mono text-caption1 opacity-70">{cc}</span>
          <div className="flex items-end justify-between gap-2">
            <span className="text-headline">{city}</span>
            <span className="font-mono text-caption1 opacity-70">{price}</span>
          </div>
        </div>
      ))}
    />
  );
}
