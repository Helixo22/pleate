import { PixelBlast } from "pleate/effects/pixel-blast";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-2xl border border-separator bg-bg p-6">
      <PixelBlast className="absolute inset-0" shape="circle" />
      <p className="relative text-center text-large-title font-semibold text-balance text-fg">Built pixel by pixel</p>
    </div>
  );
}
