import { EchoText } from "pleate/effects/echo-text";

export default function Demo() {
  return (
    <div className="grid gap-10 text-center">
      <EchoText as="h3" text="Hello, echo" className="text-display-sm font-bold" />
      <EchoText text="Sideways" x={0.1} y={0} copies={6} color="var(--pl-fg-muted)" className="text-title1 font-semibold" />
    </div>
  );
}
