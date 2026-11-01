import { PixelSwap } from "pleate/effects/pixel-swap";

export default function Demo() {
  return (
    <PixelSwap
      src="https://picsum.photos/seed/pleate-swap/800/500"
      alt="A mountain valley at dusk"
      className="grid h-72 w-full max-w-lg place-items-center rounded-xl bg-fill-3"
    >
      <div className="text-center">
        <p className="text-title2 text-fg">Hover to reveal</p>
        <p className="text-subhead text-fg-muted">The wave starts where you come in.</p>
      </div>
    </PixelSwap>
  );
}
