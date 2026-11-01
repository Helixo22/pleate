import { TextCursor } from "pleate/effects/text-cursor";

export default function Demo() {
  return (
    <TextCursor className="grid h-64 w-full place-items-center rounded-3xl bg-surface-2">
      <p className="text-title3 text-fg-muted">Move your pointer here</p>
    </TextCursor>
  );
}
