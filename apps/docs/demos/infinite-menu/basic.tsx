"use client";

import { InfiniteMenu } from "pleate/effects/infinite-menu";

const items = [
  { image: "https://picsum.photos/seed/pl-im1/300/300", title: "Coastline", description: "Waves and cliffs" },
  { image: "https://picsum.photos/seed/pl-im2/300/300", title: "Alpine", description: "High trails" },
  { image: "https://picsum.photos/seed/pl-im3/300/300", title: "City", description: "Streets at dusk" },
  { image: "https://picsum.photos/seed/pl-im4/300/300", title: "Desert", description: "Dunes and wind" },
  { image: "https://picsum.photos/seed/pl-im5/300/300", title: "Forest", description: "Moss and pine" },
  { image: "https://picsum.photos/seed/pl-im6/300/300", title: "Harbor", description: "Boats at rest" },
];

export default function Demo() {
  return <InfiniteMenu items={items} onSelect={(item) => console.log(item.title)} className="w-full" />;
}
