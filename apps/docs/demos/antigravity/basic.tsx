import { Antigravity } from "pleate/effects/antigravity";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-xl bg-bg">
      <Antigravity className="absolute inset-0" />
      <h3 className="pointer-events-none relative px-6 text-center text-display-sm">Lighter than air</h3>
    </div>
  );
}
