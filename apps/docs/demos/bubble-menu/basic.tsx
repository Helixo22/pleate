import { BubbleMenu } from "pleate/effects/bubble-menu";

const LINKS = [
  { label: "Home", href: "#home", color: "#ff9f0a" },
  { label: "About", href: "#about", color: "#30d158" },
  { label: "Projects", href: "#projects", color: "#0a84ff" },
  { label: "Blog", href: "#blog", color: "#bf5af2" },
  { label: "Contact", href: "#contact", color: "#ff375f" },
];

export default function Demo() {
  return (
    <div className="relative h-96 w-full overflow-hidden rounded-xl bg-fill-3">
      <BubbleMenu position="absolute" logo={<span className="font-brand">studio</span>} items={LINKS} />
      <p className="grid h-full place-items-center text-subhead text-fg-muted">Open the menu in the corner.</p>
    </div>
  );
}
