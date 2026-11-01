import { Shuffle } from "pleate/effects/shuffle";

export default function Demo() {
  return (
    <div className="grid gap-6 text-center">
      <Shuffle as="h3" text="DEPARTURES" className="font-brand text-display-sm" />
      <Shuffle text="Hover to spin again" direction="down" className="text-title3 text-fg-muted" />
    </div>
  );
}
