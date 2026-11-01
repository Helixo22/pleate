import { PixelCard } from "pleate/effects/pixel-card";

export default function Demo() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <PixelCard tabIndex={0} className="pl-focus-ring grid aspect-[4/3] place-items-center">
        <p className="text-title2">Hover me</p>
      </PixelCard>
      <PixelCard tabIndex={0} gap={8} speed={0.7} colors={["#ff9f0a", "#ff375f", "#ffd60a"]} className="pl-focus-ring grid aspect-[4/3] place-items-center">
        <p className="text-title2">Warm</p>
      </PixelCard>
    </div>
  );
}
