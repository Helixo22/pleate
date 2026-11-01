import { DarkVeil } from "pleate/effects/dark-veil";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-xl bg-bg">
      <DarkVeil className="absolute inset-0" />
      <h3 className="pointer-events-none relative px-6 text-center text-display-sm">Behind the veil</h3>
    </div>
  );
}
