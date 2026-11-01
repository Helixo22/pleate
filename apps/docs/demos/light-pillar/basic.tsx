import { LightPillar } from "pleate/effects/light-pillar";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-3xl bg-bg">
      <LightPillar className="absolute inset-0" />
      <h2 className="pointer-events-none relative px-6 text-center text-display-sm text-balance text-fg">Stand in the light</h2>
    </div>
  );
}
