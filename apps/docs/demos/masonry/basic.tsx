import { Masonry } from "pleate/effects/masonry";

const ratios = [1.3, 0.8, 1.5, 1, 1.2, 0.7, 1.4, 0.9, 1.1, 1.6, 0.8, 1.2];
const items = ratios.map((ratio, i) => ({
  id: String(i),
  ratio,
  src: `https://picsum.photos/seed/pl-ma${i}/400/${Math.round(400 * ratio)}`,
  alt: `Gallery photo ${i + 1}`,
}));

export default function Demo() {
  return <Masonry items={items} className="w-full" />;
}
