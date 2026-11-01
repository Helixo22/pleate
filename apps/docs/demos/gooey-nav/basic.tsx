import { GooeyNav } from "pleate/effects/gooey-nav";

const items = [{ label: "Home" }, { label: "Projects" }, { label: "Notes" }, { label: "About" }, { label: "Contact" }];

export default function Demo() {
  return <GooeyNav items={items} aria-label="Demo" />;
}
