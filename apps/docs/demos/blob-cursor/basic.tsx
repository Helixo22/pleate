import { BlobCursor } from "pleate/effects/blob-cursor";

export default function Demo() {
  return (
    <BlobCursor className="grid h-72 w-full place-items-center overflow-hidden rounded-xl bg-surface">
      <p className="text-title2 mix-blend-difference text-white">Move the pointer here</p>
    </BlobCursor>
  );
}
