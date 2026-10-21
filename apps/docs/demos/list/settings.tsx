"use client";

import { Archive, Bell, Bluetooth, Globe, Moon, Plane, Trash2, Wifi } from "lucide-react";
import { Avatar } from "pleate/avatar";
import { Badge } from "pleate/badge";
import { List, ListItem, ListSection } from "pleate/list";
import { Switch } from "pleate/switch";
import { toast } from "pleate/toast";
import { useState } from "react";

export default function Demo() {
  const [airplane, setAirplane] = useState(false);
  const [lang, setLang] = useState("English");
  const [trips, setTrips] = useState(["Weekend in Lisbon", "Kyoto in spring", "Road trip — Andalusia"]);
  return (
    <div className="w-full max-w-md rounded-3xl bg-bg p-4">
      <List>
        <ListSection>
          <ListItem
            leading={<Avatar name="Sofia Rossi" size="lg" />}
            title={<span className="text-title3">Sofia Rossi</span>}
            subtitle="Apple Account, iCloud and more"
            href="#settings"
          />
        </ListSection>

        <ListSection header="Connectivity">
          <ListItem
            icon={<Plane />}
            iconColor="var(--pl-warning)"
            title="Airplane Mode"
            trailing={<Switch aria-label="Airplane Mode" tone="success" checked={airplane} onCheckedChange={setAirplane} />}
          />
          <ListItem icon={<Wifi />} iconColor="var(--pl-info)" title="Wi-Fi" value={airplane ? "Off" : "Home"} href="#settings" />
          <ListItem icon={<Bluetooth />} iconColor="var(--pl-info)" title="Bluetooth" value="On" href="#settings" />
        </ListSection>

        <ListSection header="General" footer="Notifications from trips you follow appear on the Lock Screen.">
          <ListItem icon={<Bell />} iconColor="var(--pl-danger)" title="Notifications" trailing={<Badge variant="solid" tone="danger">2</Badge>} href="#settings" />
          <ListItem icon={<Moon />} iconColor="var(--pl-accent)" title="Focus" subtitle="Silence notifications while you travel" href="#settings" />
        </ListSection>

        <ListSection header="Language">
          {["English", "Español", "Italiano"].map((l) => (
            <ListItem key={l} icon={<Globe />} iconColor="var(--pl-success)" title={l} selected={lang === l} onClick={() => setLang(l)} />
          ))}
        </ListSection>

        <ListSection header="Trips" footer="Swipe a trip left — or Tab to its actions.">
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
