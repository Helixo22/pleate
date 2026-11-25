"use client";

import { PixelCanvas, PixelSteps, shapes, type PixelBuffer, type PixelFrameState } from "pleate/effects/pixel-art";
import { pixelRamps as r } from "pleate/effects/pixel-gallery";
import { range, ScrollBeat, ScrollScene } from "pleate/effects/scroll-scene";

const { ellipse, rect, taper, or } = shapes;
const INK = "#2a1720";
const DISC = ["color-mix(in oklab, var(--pl-accent), white 30%)", "var(--pl-accent)", "color-mix(in oklab, var(--pl-accent), black 14%)"];

// One 96 by 96 picture for every point of the scroll: the sun climbs, the stem grows, the leaves open, the flower blooms.
function draw(p: PixelBuffer, { progress, time }: PixelFrameState) {
  p.shade(ellipse(48, 46, 41, 41), DISC, { dither: 0.5 });

  const stem = Math.round(range(progress, 0.12, 0.6) * 40);
  const ground = 70;
  const sway = Math.sin(time * 1.4) * Math.min(1.4, stem / 26);
  const at = (h: number) => 48 + Math.round(Math.sin(h * 0.11) * 2 + sway * (h / 40));
  for (let h = 0; h < stem; h++) p.rect(at(h), ground - h, 3, 1, h % 4 === 0 ? r.green[0] : r.green[1]);

  [[10, -1], [18, 1], [27, -1], [34, 1]].forEach(([h, side], i) => {
    const open = range(progress, 0.28 + i * 0.08, 0.46 + i * 0.08);
    if (open <= 0 || stem < h) return;
    const rx = 1 + 8 * open;
    p.shade(ellipse(at(h) + 1 + side * (rx + 1), ground - h - 2 * open, rx, 1 + 2.6 * open), r.green);
  });

  const bloom = range(progress, 0.66, 0.92);
  if (stem > 30 && bloom > 0) {
    const [x, y] = [at(stem) + 1, ground - stem];
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + 0.2;
      p.shade(ellipse(x + Math.cos(a) * 10 * bloom, y + Math.sin(a) * 9 * bloom, 6 * bloom + 0.6, 5.4 * bloom + 0.6), r.pink);
    }
    p.shade(ellipse(x, y, 2 + 5 * bloom, 2 + 4.6 * bloom), r.yellow);
  } else if (stem > 2) p.shade(ellipse(at(stem) + 1, ground - stem, 2.6, 3.4), r.green);

  p.shade(ellipse(48, 71, 17, 3.4), r.brown, { light: [1, 1] });
  if (progress < 0.2) p.shade(ellipse(48, 69 - (1 - range(progress, 0, 0.12)) * 22, 3.4, 2.6), r.yellow);
  p.shade(or(rect(28, 72, 41, 6), taper(48, 77, 14, 34, 24)), r.orange);
  p.rect(28, 77, 41, 1, r.orange[2]);
  p.outline(INK);

  // Pollen, once the flower is open.
  if (bloom > 0.5) for (let i = 0; i < 7; i++) p.dots([[26 + ((i * 17 + time * 5) % 46), 24 + ((i * 11 + time * 3) % 34)]], r.yellow[0]);
}

const BEATS = [
  { title: "A seed", body: "It drops into the pot as you start to scroll." },
  { title: "A stem", body: "Every row of pixels is drawn again for each point of the scroll." },
  { title: "Leaves", body: "Scroll back and they fold up again." },
  { title: "A flower", body: "Only the sway and the pollen move on their own clock." },
];

export default function Demo() {
  return (
    <ScrollScene
      length={4}
      label="A flower growing"
      className="w-full"
      stage={
        <div className="grid size-full place-items-center pb-48">
          <PixelCanvas draw={draw} animate label="A flower growing in a pot as you scroll" className="h-auto w-[min(26rem,80vw,52dvh)]" />
        </div>
      }
    >
      {BEATS.map((beat, i) => (
        <ScrollBeat key={beat.title} from={i / 4} to={(i + 1) / 4} className="items-end justify-center pb-24 text-center md:pb-24">
          <div className="max-w-sm">
            <h3 className="text-title2 text-fg">{beat.title}</h3>
            <p className="mt-1 text-body text-fg-muted">{beat.body}</p>
          </div>
        </ScrollBeat>
      ))}
      <div className="absolute inset-x-0 bottom-10 flex justify-center">
        <PixelSteps steps={BEATS.map((b) => b.title)} label="Growth" />
      </div>
    </ScrollScene>
  );
}
