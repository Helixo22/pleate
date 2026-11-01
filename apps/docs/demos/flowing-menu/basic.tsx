import { FlowingMenu } from "pleate/effects/flowing-menu";

const ITEMS = [
  { label: "Mountains", href: "#mountains", image: "https://picsum.photos/id/1018/300/150" },
  { label: "Rivers", href: "#rivers", image: "https://picsum.photos/id/1015/300/150" },
  { label: "Canyons", href: "#canyons", image: "https://picsum.photos/id/1016/300/150" },
  { label: "Castles", href: "#castles", image: "https://picsum.photos/id/1040/300/150" },
];

export default function Demo() {
  return <FlowingMenu items={ITEMS} label="Destinations" />;
}
