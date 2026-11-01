import { Calendar, FileText, Heart, Music, Cloud, Settings } from "lucide-react";
import { GlassIcons } from "pleate/effects/glass-icons";

const items = [
  { icon: <FileText />, label: "Files", color: "#0a84ff" },
  { icon: <Music />, label: "Music", color: "#ff375f" },
  { icon: <Calendar />, label: "Calendar", color: "#ff9f0a" },
  { icon: <Heart />, label: "Health", color: "#bf5af2" },
  { icon: <Cloud />, label: "Weather", color: "#64d2ff" },
  { icon: <Settings />, label: "Settings", color: "#8e8e93" },
];

export default function Demo() {
  return <GlassIcons items={items} className="max-w-md py-6" />;
}
