import { TextLoop } from "pleate/effects/text-loop";

export default function Demo() {
  return (
    <div className="grid gap-10 text-center">
      <p className="text-title1 font-semibold">
        Built for <TextLoop items={["founders", "designers", "teams", "you"]} className="text-accent-ink" />
      </p>
      <TextLoop rows={3} items={["Lisbon", "Kyoto", "Naples", "Oaxaca", "Bergen"]} className="text-title2 font-semibold" />
    </div>
  );
}
