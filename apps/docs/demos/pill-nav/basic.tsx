import { Hexagon } from "lucide-react";
import { PillNav } from "pleate/effects/pill-nav";

const items = [
  { label: "Home", href: "#home" },
  { label: "Work", href: "#work" },
  { label: "Studio", href: "#studio" },
  { label: "Contact", href: "#contact" },
];

export default function Demo() {
  return <PillNav items={items} activeHref="#home" logo={<Hexagon />} logoHref="#" aria-label="Demo" className="w-full max-w-lg" />;
}
