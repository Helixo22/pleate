import { PixelTransition } from "pleate/effects/pixel-transition";

export default function Demo() {
  return (
    <PixelTransition
      className="aspect-square w-72 rounded-xl"
      first={<img src="https://picsum.photos/seed/pleate-pixel/600/600" alt="A quiet harbor" className="size-full object-cover" />}
      second={
        <div className="grid size-full place-items-center bg-accent p-6 text-center text-on-accent">
          <p className="text-title2">Harbor, 6:40 am</p>
        </div>
      }
    />
  );
}
