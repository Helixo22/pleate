import { SwarmCursor } from "pleate/effects/swarm-cursor";

export default function Demo() {
  return (
    <SwarmCursor className="grid h-96 w-full place-items-center rounded-xl bg-fill-3">
      <p className="text-title2 text-fg-muted">They follow you</p>
    </SwarmCursor>
  );
}
