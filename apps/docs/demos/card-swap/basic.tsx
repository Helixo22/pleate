import { CardSwap } from "pleate/effects/card-swap";

const CARDS = [
  { title: "Customizable", body: "Every token, radius and color follows your palette." },
  { title: "Reliable", body: "Keyboard, screen readers and reduced motion covered." },
  { title: "Smooth", body: "Springs tuned to settle without wobble." },
  { title: "Small", body: "No 3D library: just CSS transforms and Motion." },
];

export default function Demo() {
  return (
    <div className="grid w-full place-items-center pt-16">
      <CardSwap label="Highlights" width={300} height={190}>
        {CARDS.map((card) => (
          <div key={card.title} className="flex h-full flex-col justify-between p-6">
            <p className="text-title2">{card.title}</p>
            <p className="text-subhead text-fg-muted">{card.body}</p>
          </div>
        ))}
      </CardSwap>
    </div>
  );
}
