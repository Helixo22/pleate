"use client";

import { Archive, Bell, Bluetooth, HardDrive, Moon, Plane, Trash2, Wifi } from "lucide-react";
import { Avatar } from "pleate/avatar";
import { Badge } from "pleate/badge";
import { List, ListItem, ListSection } from "pleate/list";
import { Switch } from "pleate/switch";
import { toast } from "pleate/toast";
import { useState } from "react";

export default function Demo() {
  const [airplane, setAirplane] = useState(false);
  const [lang, setLang] = useState("English");
  const [trips, setTrips] = useState(["Weekend in Lisbon", "Kyoto in spring", "Road trip in Andalusia"]);
  return (
    <div className="w-full max-w-md rounded-xl bg-bg p-4">
      <List>
        <ListSection>
          <ListItem
            leading={<Avatar name="Sofia Rossi" size="lg" />}
            title={<span className="text-title3">Sofia Rossi</span>}
            subtitle="Account, plan and devices"
            href="#settings"
          />
        </ListSection>

        <ListSection header="Connectivity">
          <ListItem
            icon={<Plane />}
            iconColor="#ff9500"
            title="Airplane Mode"
            trailing={<Switch aria-label="Airplane Mode" tone="success" checked={airplane} onCheckedChange={setAirplane} />}
          />
          <ListItem icon={<Wifi />} iconColor="#007aff" title="Wi-Fi" value={airplane ? "Off" : "Home"} href="#settings" />
          <ListItem icon={<Bluetooth />} iconColor="#007aff" title="Bluetooth" value="On" href="#settings" />
        </ListSection>

        <ListSection header="General" footer="Notifications from trips you follow appear on the Lock Screen">
          <ListItem icon={<Bell />} iconColor="#ff3b30" title="Notifications" trailing={<Badge variant="solid" tone="danger">2</Badge>} href="#settings" />
          <ListItem icon={<Moon />} iconColor="#5e5ce6" title="Focus" subtitle="Silence notifications while you travel" href="#settings" />
          <ListItem icon={<HardDrive />} iconColor="#8e8e93" title="Offline maps" value="2.4 GB" href="#settings" />
        </ListSection>

        <ListSection header="Language">
          {["English", "Español", "Italiano"].map((l) => (
            <ListItem key={l} title={l} selected={lang === l} onClick={() => setLang(l)} />
          ))}
        </ListSection>

        <ListSection header="Trips" footer="Swipe a trip left, or Tab to its actions">
          {trips.map((t) => (
            <ListItem
              key={t}
              title={t}
              href="#settings"
              swipeActions={[
                { label: "Archive", icon: <Archive />, tone: "neutral", onSelect: () => toast(`Archived “${t}”`) },
                {
                  label: "Delete",
                  icon: <Trash2 />,
                  tone: "danger",
                  onSelect: () => {
                    setTrips((list) => list.filter((x) => x !== t));
                    toast.error(`Deleted “${t}”`);
                  },
                },
              ]}
            />
          ))}
        </ListSection>

        <ListSection>
          <ListItem title="Sign Out" tone="danger" onClick={() => toast("Signed out")} />
        </ListSection>
      </List>
    </div>
  );
}
