import { PixelTrail } from "pleate/effects/pixel-trail";

export default function Demo() {
  return (
    <PixelTrail gridSize={28} className="grid h-96 w-full place-items-center rounded-xl bg-fill-3">
      <p className="text-title2 text-fg-muted">Draw with the pointer</p>
    </PixelTrail>
  );
}
