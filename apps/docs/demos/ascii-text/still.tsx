import { AsciiText } from "pleate/effects/ascii-text";

export default function Demo() {
  return <AsciiText text="HELLO" ramp=" .oO@" cell={7} amplitude={0} color="var(--pl-fg-muted)" className="max-w-md" />;
}
