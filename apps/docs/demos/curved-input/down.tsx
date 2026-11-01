import { CurvedInput } from "pleate/effects/curved-input";

export default function Demo() {
  return <CurvedInput label="Email" placeholder="you@example.com" curve={-40} thickness={48} width={420} submitLabel="Subscribe" />;
}
