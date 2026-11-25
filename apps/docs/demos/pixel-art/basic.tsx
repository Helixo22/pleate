import { PixelArt, PixelBuffer, shapes } from "pleate/effects/pixel-art";
import { pixelDrawing } from "pleate/effects/pixel-gallery";

// Your own drawing: shade a few shapes with a ramp of three tones, then close it with an outline.
const balloon = new PixelBuffer(32)
  .shade(shapes.ellipse(16, 12, 10, 11), ["color-mix(in oklab, var(--pl-accent), white 40%)", "var(--pl-accent)", "color-mix(in oklab, var(--pl-accent), black 35%)"], { dither: 0.9 })
  .fill(shapes.polygon([[14, 23], [19, 23], [16, 21]]), "var(--pl-accent)")
  .dots([[10, 7], [10, 8], [11, 6], [11, 7]], "white")
  .outline("#2a1720")
  .line(16, 25, 14, 31, "#2a1720");

export default function Demo() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-8">
      <PixelArt art={pixelDrawing("coffee")} label="A cup of coffee" className="size-12" />
      <PixelArt art={pixelDrawing("coffee")} label="The same cup, larger" className="size-24" />
      <PixelArt art={balloon} label="A balloon in the accent color" className="size-48" />
    </div>
  );
}
