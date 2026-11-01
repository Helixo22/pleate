import { SwipeStack } from "pleate/effects/swipe-stack";

const cards = [1, 2, 3, 4].map((i) => (
  <img key={i} src={`https://picsum.photos/seed/pl-sw${i}/500/660`} alt={`Travel photo ${i}`} draggable={false} className="size-full object-cover" />
));

export default function Demo() {
  return <SwipeStack cards={cards} aria-label="Travel photos" />;
}
