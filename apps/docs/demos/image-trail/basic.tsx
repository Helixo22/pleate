import { ImageTrail } from "pleate/effects/image-trail";

const IMAGES = [1, 2, 3, 4, 5, 6].map((n) => `https://picsum.photos/seed/pleate-trail-${n}/320/400`);

export default function Demo() {
  return (
    <ImageTrail images={IMAGES} size={140} className="grid h-96 w-full place-items-center rounded-xl bg-fill-3">
      <p className="text-title2 text-fg-muted">Move the pointer across</p>
    </ImageTrail>
  );
}
