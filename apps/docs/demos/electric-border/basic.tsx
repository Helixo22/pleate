import { ElectricBorder } from "pleate/effects/electric-border";
import { Button } from "pleate/button";

export default function Demo() {
  return (
    <div className="grid w-full gap-8 py-4 sm:grid-cols-2">
      <ElectricBorder className="rounded-2xl">
        <div className="rounded-2xl bg-surface p-6">
          <p className="text-headline">High voltage</p>
          <p className="text-subhead text-fg-muted">The border crackles around any content.</p>
        </div>
      </ElectricBorder>
      <ElectricBorder color="#ff9f0a" chaos={10} speed={1.6} thickness={3} className="grid place-items-center rounded-full">
        <Button size="lg" variant="plain">Wilder, orange</Button>
      </ElectricBorder>
    </div>
  );
}
