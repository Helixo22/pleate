import { GhostCursor } from "pleate/effects/ghost-cursor";

export default function Demo() {
  return (
    <GhostCursor color="var(--pl-accent)" size={34} life={1.6} opacity={0.5} className="grid h-56 w-full place-items-center overflow-hidden rounded-xl bg-fill-3">
      <p className="text-headline">Accent, bigger and slower</p>
    </GhostCursor>
  );
}
