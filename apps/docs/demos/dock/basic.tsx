import { Archive, Camera, House, Music, Settings, User } from "lucide-react";
import { Dock } from "pleate/effects/dock";

const ITEMS = [
  { icon: <House />, label: "Home", active: true },
  { icon: <Archive />, label: "Archive" },
  { icon: <Camera />, label: "Photos", active: true },
  { icon: <Music />, label: "Music" },
  { icon: <User />, label: "Profile" },
  { icon: <Settings />, label: "Settings" },
];

export default function Demo() {
  return (
    <div className="flex h-48 w-full items-end justify-center">
      <Dock items={ITEMS} label="Apps" />
    </div>
  );
}
