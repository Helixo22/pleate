import { GhostCursor } from "pleate/effects/ghost-cursor";

export default function Demo() {
  return (
    <GhostCursor className="grid h-72 w-full place-items-center overflow-hidden rounded-xl bg-surface">
      <p className="text-title2">Leave a trail of smoke</p>
    </GhostCursor>
  );
}
