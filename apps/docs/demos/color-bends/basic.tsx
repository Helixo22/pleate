import { ColorBends } from "pleate/effects/color-bends";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-xl bg-bg">
      <ColorBends className="absolute inset-0" />
      <h3 className="pointer-events-none relative px-6 text-center text-display-sm">Bend the light</h3>
    </div>
  );
}
