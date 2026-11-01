import { ArrowRight } from "lucide-react";
import { SpecularButton } from "pleate/effects/specular-button";

export default function Demo() {
  return (
    <div
      className="grid w-full place-items-center gap-4 rounded-3xl p-12"
      style={{ background: "radial-gradient(circle at 30% 20%, var(--pl-accent), transparent 60%), radial-gradient(circle at 80% 80%, #ff375f, transparent 55%), var(--pl-bg)" }}
    >
      <SpecularButton size="lg">
        Get started <ArrowRight className="size-5" />
      </SpecularButton>
      <SpecularButton>Learn more</SpecularButton>
    </div>
  );
}
