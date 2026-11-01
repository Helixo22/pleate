import { LightRays } from "pleate/effects/light-rays";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-3xl bg-bg">
      <LightRays className="absolute inset-0" />
      <h2 className="pointer-events-none relative px-6 text-center text-display-sm text-balance text-fg">Let the light in</h2>
    </div>
  );
}
