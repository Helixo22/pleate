import { LaserFlow } from "pleate/effects/laser-flow";

export default function Demo() {
  return (
    <LaserFlow x={0.68} floor={0.22} className="h-96 w-full rounded-xl bg-black p-8">
      <p className="max-w-xs text-title1 text-white">Ship from the edge.</p>
      <p className="mt-2 max-w-xs text-subhead text-white/60">A beam of light with a fog that pools where it lands.</p>
    </LaserFlow>
  );
}
