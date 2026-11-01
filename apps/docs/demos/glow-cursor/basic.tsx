import { GlowCursor } from "pleate/effects/glow-cursor";

export default function Demo() {
  return (
    <GlowCursor className="grid h-72 w-full place-items-center overflow-hidden rounded-xl bg-surface">
      <div className="text-center">
        <p className="text-title2">A glow follows you</p>
        <p className="text-subhead text-fg-muted">With a little lag, behind the text.</p>
      </div>
    </GlowCursor>
  );
}
