import { Calendar, CreditCard, FileText, Mail, MapPin, MessageSquare, Plane, Receipt } from "lucide-react";
import { Orbit, OrbitRing } from "pleate/effects/motion-graphics";
import type { ReactNode } from "react";

const Tile = ({ children }: { children: ReactNode }) => (
  <span className="pl-field grid size-9 place-items-center rounded-md bg-surface text-fg-muted [&_svg]:size-4">{children}</span>
);

export default function Demo() {
  return (
    <Orbit
      size={300}
      label="Connected services"
      center={<span className="grid size-14 place-items-center rounded-lg bg-fg font-mono text-subhead text-bg">plate</span>}
    >
      <OrbitRing radius={70} duration={22}>
        <Tile><Plane /></Tile>
        <Tile><Calendar /></Tile>
        <Tile><MapPin /></Tile>
      </OrbitRing>
      <OrbitRing radius={130} duration={36} reverse>
        <Tile><Mail /></Tile>
        <Tile><CreditCard /></Tile>
        <Tile><Receipt /></Tile>
        <Tile><MessageSquare /></Tile>
        <Tile><FileText /></Tile>
      </OrbitRing>
    </Orbit>
  );
}
