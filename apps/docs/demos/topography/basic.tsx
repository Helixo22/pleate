import { Topography } from "pleate/effects/topography";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-2xl border border-separator bg-bg p-6">
      <Topography className="absolute inset-0" />
      <p className="relative text-center text-large-title font-semibold text-balance text-fg">Map the ground first</p>
    </div>
  );
}
