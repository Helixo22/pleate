import { Button } from "pleate/button";
import { CardNav } from "pleate/effects/card-nav";

const GROUPS = [
  { title: "About", links: [{ label: "Company", href: "#company" }, { label: "Careers", href: "#careers" }] },
  { title: "Projects", background: "var(--pl-accent)", color: "var(--pl-on-accent)", links: [{ label: "Featured", href: "#featured" }, { label: "Case studies", href: "#cases" }] },
  { title: "Contact", links: [{ label: "Email", href: "#email" }, { label: "Office", href: "#office" }, { label: "Press", href: "#press" }] },
];

export default function Demo() {
  return (
    <div className="flex h-96 w-full items-start justify-center">
      <CardNav logo={<span className="font-brand">northwind</span>} groups={GROUPS} action={<Button size="sm">Get started</Button>} />
    </div>
  );
}
