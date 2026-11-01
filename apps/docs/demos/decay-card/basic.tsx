import { DecayCard } from "pleate/effects/decay-card";

export default function Demo() {
  return (
    <DecayCard src="https://picsum.photos/id/1069/600/800" alt="Jellyfish in dark water" width={280} height={380}>
      <p className="text-title3">Drift</p>
      <p className="text-subhead text-white/80">Move the pointer quickly across.</p>
    </DecayCard>
  );
}
