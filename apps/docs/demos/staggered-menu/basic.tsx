import { StaggeredMenu } from "pleate/effects/staggered-menu";

const items = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];

export default function Demo() {
  return (
    <div className="relative h-[28rem] w-full overflow-hidden rounded-3xl bg-fill-3">
      <div className="flex items-center justify-between p-4">
        <p className="text-headline">Northwind</p>
        <StaggeredMenu items={items} contained />
      </div>
    </div>
  );
}
