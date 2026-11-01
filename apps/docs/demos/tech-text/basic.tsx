import { TechText } from "pleate/effects/tech-text";

export default function Demo() {
  return (
    <div className="grid justify-items-center gap-8">
      <TechText text="SYSTEM ONLINE // ALL CHECKS PASSED" className="text-title3" />
      <TechText text="Uplink 4 of 4 ready" frame={false} cursor={false} speed={60} className="text-subhead text-fg-muted" />
    </div>
  );
}
