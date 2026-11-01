import { VariableProximity } from "pleate/effects/variable-proximity";

export default function Demo() {
  return <VariableProximity text="Soft focus" fromWeight={200} toWeight={800} radius={140} falloff="gaussian" className="text-display-sm text-accent-ink" />;
}
