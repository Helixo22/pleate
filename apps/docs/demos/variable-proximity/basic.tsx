import { VariableProximity } from "pleate/effects/variable-proximity";

export default function Demo() {
  return (
    <VariableProximity
      as="p"
      text="Move your pointer over this sentence and watch the letters gain weight."
      className="max-w-xl text-center text-title1"
    />
  );
}
