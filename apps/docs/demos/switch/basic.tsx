"use client";

import { Bell, Moon, Plane, Wifi } from "lucide-react";
import { List, ListItem, ListSection } from "pleate/list";
import { Switch } from "pleate/switch";
import { useState } from "react";

export default function Demo() {
  const [airplane, setAirplane] = useState(false);
  const [wifi, setWifi] = useState(true);
  return (
    <div className="grid w-full max-w-md gap-8">
      <div className="flex flex-wrap items-center gap-4">
        <Switch aria-label="Large" size="lg" defaultChecked />
        <Switch aria-label="Medium" defaultChecked />
        <Switch aria-label="Small" size="sm" defaultChecked />
        <Switch aria-label="System green" tone="success" defaultChecked />
        <Switch aria-label="Off" />
        <Switch aria-label="Disabled" disabled defaultChecked />
      </div>
      <List className="rounded-2xl bg-bg p-4">
        <ListSection header="Connectivity" footer="Turning on Airplane Mode turns off Wi-Fi">
          <ListItem
            icon={<Plane />}
            iconColor="#ff9500"
            title="Airplane Mode"
            trailing={<Switch aria-label="Airplane Mode" checked={airplane} onCheckedChange={(on) => { setAirplane(on); if (on) setWifi(false); }} />}
          />
          <ListItem icon={<Wifi />} iconColor="#007aff" title="Wi-Fi" trailing={<Switch aria-label="Wi-Fi" checked={wifi} onCheckedChange={setWifi} />} />
        </ListSection>
        <ListSection>
          <ListItem icon={<Bell />} iconColor="#ff3b30" title="Trip alerts" subtitle="Gate changes and delays" trailing={<Switch aria-label="Trip alerts" tone="success" defaultChecked />} />
          <ListItem icon={<Moon />} iconColor="#5e5ce6" title="Quiet hours" trailing={<Switch aria-label="Quiet hours" tone="success" />} />
        </ListSection>
      </List>
      <Switch label="Offline maps" description="Download maps for the cities in your trip" labelPlacement="start" defaultChecked />
    </div>
  );
}
