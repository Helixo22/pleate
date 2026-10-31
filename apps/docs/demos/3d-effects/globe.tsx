import { DotGlobe } from "pleate/effects/depth";

const ROUTE = [
  { lat: 38.72, lon: -9.14, label: "LIS" },
  { lat: 41.15, lon: -8.61, label: "OPO" },
  { lat: 40.85, lon: 14.27, label: "NAP" },
  { lat: 35.01, lon: 135.77, label: "KIX" },
  { lat: 17.07, lon: -96.73, label: "OAX" },
  { lat: 64.15, lon: -21.94, label: "KEF" },
];

export default function Demo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <DotGlobe size={340} markers={ROUTE} label="Trips this year" className="max-w-full" />
      <p className="font-mono text-caption1 text-fg-subtle">Drag or use the arrow keys to turn it</p>
    </div>
  );
}
