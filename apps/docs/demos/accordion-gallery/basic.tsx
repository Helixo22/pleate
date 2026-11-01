import { AccordionGallery } from "pleate/effects/accordion-gallery";

const ITEMS = [
  { src: "https://picsum.photos/id/1018/1200/800", alt: "Mountains under a blue sky", title: "Dolomites", caption: "Seven days on the Alta Via 1" },
  { src: "https://picsum.photos/id/1015/1200/800", alt: "River winding through a green valley", title: "Valley trail", caption: "Riverside camp, day three" },
  { src: "https://picsum.photos/id/1039/1200/800", alt: "Waterfall in a forest", title: "Falls", caption: "A short detour worth the climb" },
  { src: "https://picsum.photos/id/1016/1200/800", alt: "Red rock canyon", title: "Canyon", caption: "Late light on the walls" },
  { src: "https://picsum.photos/id/1040/1200/800", alt: "Castle on a hill", title: "Old fort", caption: "The last stop before town" },
];

export default function Demo() {
  return <AccordionGallery items={ITEMS} label="Trip photos" height={380} />;
}
