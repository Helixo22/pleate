import { InfiniteSpiral } from "pleate/effects/infinite-spiral";

const items = Array.from({ length: 16 }, (_, i) => ({ src: `https://picsum.photos/seed/pl-sp${i}/300/375`, alt: `Photo ${i + 1}` }));

export default function Demo() {
  return <InfiniteSpiral items={items} className="w-full" />;
}
