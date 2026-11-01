import { DitherVeil } from "pleate/effects/dither-veil";

export default function Demo() {
  return (
    <DitherVeil className="grid h-80 w-full place-items-center rounded-xl bg-surface">
      <div className="rounded-lg bg-surface/80 px-5 py-3 text-center backdrop-blur">
        <p className="text-title2">Through the veil</p>
        <p className="text-subhead text-fg-muted">It parts around the cursor.</p>
      </div>
    </DitherVeil>
  );
}
