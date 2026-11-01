import { FallingText } from "pleate/effects/falling-text";

export default function Demo() {
  return (
    <FallingText
      text="Click this box and everything falls apart"
      trigger="click"
      height={200}
      wordClassName="rounded-full bg-accent-soft px-3 py-1 text-accent-ink"
      className="max-w-md rounded-2xl bg-surface text-body font-medium"
    />
  );
}
