"use client";

import { Battery, Bell, Bluetooth, Hand, Moon, Plane, Sun, Wifi } from "lucide-react";
import { Avatar } from "pleate/avatar";
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarItem, SidebarSearch } from "pleate/sidebar";
import { useState, type ReactNode } from "react";

// iPadOS Settings: rows in cards, each with a small colored tile.
const Tile = ({ color, children }: { color: string; children: ReactNode }) => (
  <span className="grid size-7 shrink-0 place-items-center rounded-[0.4375rem] text-white [&_svg]:size-4! [&_svg]:text-white!" style={{ background: color }}>
    {children}
  </span>
);

const GROUPS = [
  [
    { id: "Airplane Mode", tile: <Tile color="#ff9500"><Plane /></Tile> },
    { id: "Wi-Fi", tile: <Tile color="#007aff"><Wifi /></Tile>, badge: "Home" },
    { id: "Bluetooth", tile: <Tile color="#007aff"><Bluetooth /></Tile>, badge: "On" },
    { id: "Battery", tile: <Tile color="#34c759"><Battery /></Tile> },
  ],
  [
    { id: "Notifications", tile: <Tile color="#ff3b30"><Bell /></Tile> },
    { id: "Focus", tile: <Tile color="#5856d6"><Moon /></Tile> },
    { id: "Display & Brightness", tile: <Tile color="#007aff"><Sun /></Tile> },
    { id: "Privacy & Security", tile: <Tile color="#007aff"><Hand /></Tile> },
  ],
];

export default function Demo() {
  const [active, setActive] = useState("Wi-Fi");
  return (
    <div className="flex h-[34rem] w-full overflow-hidden rounded-2xl bg-bg shadow-[inset_0_0_0_1px_var(--pl-separator)]">
      <Sidebar sticky={false} breakpoint="md" label="Settings" selection="filled">
        <SidebarHeader>
          <span className="text-title1">Settings</span>
        </SidebarHeader>
        <SidebarSearch placeholder="Search" />
        <SidebarContent className="gap-4">
          <SidebarGroup variant="card" aria-label="Account">
            <SidebarItem icon={<Avatar name="Sofia Rossi" size="sm" />} className="h-14" textValue="Sofia Rossi Apple Account">
              <span className="flex flex-col">
                <span className="text-callout">Sofia Rossi</span>
                <span className="text-footnote text-fg-muted">Account, iCloud, Media</span>
              </span>
            </SidebarItem>
          </SidebarGroup>
          {GROUPS.map((group, i) => (
            <SidebarGroup key={i} variant="card" className="pt-1.5">
              {group.map((item) => (
                <SidebarItem key={item.id} icon={item.tile} badge={item.badge} active={active === item.id} onClick={() => setActive(item.id)}>
                  {item.id}
                </SidebarItem>
              ))}
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>
      <div className="flex flex-1 flex-col items-center gap-1 p-10 text-center">
        <span className="text-title2">{active}</span>
        <span className="text-subhead text-fg-muted">Rows in cards, filled selection, a tile per row</span>
      </div>
    </div>
  );
}
