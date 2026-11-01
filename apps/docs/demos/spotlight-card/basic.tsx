import { Zap } from "lucide-react";
import { SpotlightCard } from "pleate/effects/spotlight-card";

export default function Demo() {
  return (
    <div className="grid w-full gap-4 md:grid-cols-2">
      <SpotlightCard>
        <Zap className="size-7 text-accent-ink" />
        <p className="mt-6 text-title3">Instant sync</p>
        <p className="text-subhead text-fg-muted">Changes reach every device in under a second.</p>
      </SpotlightCard>
      <SpotlightCard spotlightColor="color-mix(in oklab, #ff9f0a 25%, transparent)" size={260}>
        <p className="text-title3">Custom color</p>
        <p className="text-subhead text-fg-muted">Any CSS color, any radius.</p>
      </SpotlightCard>
    </div>
  );
}
