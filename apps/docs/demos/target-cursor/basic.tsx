import { TargetCursor } from "pleate/effects/target-cursor";
import { Button } from "pleate/button";

export default function Demo() {
  return (
    <TargetCursor className="flex h-80 w-full flex-wrap items-center justify-center gap-4 rounded-xl bg-fill-3">
      <Button data-cursor-target="">Lock on me</Button>
      <Button data-cursor-target="" variant="tinted">
        Or me
      </Button>
      <span data-cursor-target="" className="rounded-lg bg-surface px-4 py-2 text-callout text-fg">
        Any element works
      </span>
    </TargetCursor>
  );
}
