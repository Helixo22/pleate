import { House } from "lucide-react";
import { Breadcrumb } from "pleate/breadcrumb";

export default function Demo() {
  return (
    <div className="grid gap-6">
      <Breadcrumb
        items={[
          { label: "Home", href: "#basic", icon: <House /> },
          { label: "Europe", href: "#basic" },
          { label: "Portugal", href: "#basic" },
          { label: "Lisbon" },
        ]}
      />
      <Breadcrumb
        maxItems={3}
        items={[
          { label: "Trips", href: "#basic" },
          { label: "2026", href: "#basic" },
          { label: "Summer", href: "#basic" },
          { label: "Portugal", href: "#basic" },
          { label: "Day 3: Sintra" },
        ]}
      />
    </div>
  );
}
