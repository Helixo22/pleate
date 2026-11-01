import { Noise } from "pleate/effects/noise";

export default function Demo() {
  return (
    <div
      className="relative grid h-64 w-full place-items-center overflow-hidden rounded-xl"
      style={{ background: "linear-gradient(135deg, var(--pl-accent), var(--pl-bg))" }}
    >
      <Noise opacity={0.14} />
      <p className="relative text-title1 text-fg">Grain on a gradient</p>
    </div>
  );
}
