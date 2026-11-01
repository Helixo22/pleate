import { GridMotion } from "pleate/effects/grid-motion";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-3xl bg-bg">
      <GridMotion className="absolute inset-0" items={["Design", "Build", "Ship", "Measure", "Learn", "Repeat"]} />
      <h2 className="pointer-events-none relative px-6 text-center text-display-sm text-balance text-fg">Everything in motion</h2>
    </div>
  );
}
