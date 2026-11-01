import { Crosshair } from "pleate/effects/crosshair";

export default function Demo() {
  return (
    <Crosshair className="grid h-72 w-full place-items-center rounded-xl bg-surface">
      <div className="text-center">
        <p className="text-title2">Aim anywhere</p>
        <p className="text-subhead text-fg-muted">The lines stay inside this card.</p>
      </div>
    </Crosshair>
  );
}
