"use client";

import { Archive, CalendarDays, Compass, FileText, Heart, Inbox, Map, Menu, Plane, Send, Settings, Star, Trash2 } from "lucide-react";
import { Avatar } from "pleate/avatar";
import { Badge } from "pleate/badge";
import { Button } from "pleate/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarItem, SidebarSearch } from "pleate/sidebar";
import { Switch } from "pleate/switch";
import { useState } from "react";

const GROUPS = [
  {
    label: "Plan",
    icon: <Map />,
    items: [
      { id: "Explore", icon: <Compass /> },
      { id: "Trips", icon: <CalendarDays />, badge: 3 },
      { id: "Flights", icon: <Plane /> },
      { id: "Saved", icon: <Heart />, badge: 12 },
    ],
  },
  {
    label: "Mailboxes",
    icon: <Inbox />,
    items: [
      { id: "Inbox", icon: <Inbox />, badge: <Badge size="sm" variant="solid" tone="danger">2</Badge> },
      { id: "Flagged", icon: <Star /> },
      { id: "Drafts", icon: <FileText /> },
      { id: "Sent", icon: <Send /> },
      { id: "Archive", icon: <Archive /> },
      { id: "Trash", icon: <Trash2 /> },
    ],
  },
];

export default function Demo() {
  const [active, setActive] = useState("Explore");
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [soft, setSoft] = useState(false);
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button size="sm" variant="gray" startIcon={<Menu />} onClick={() => setOpen(true)} className="lg:hidden">
          Open drawer
        </Button>
        <Switch size="sm" label="Icon rail" checked={collapsed} onCheckedChange={setCollapsed} className="hidden lg:inline-flex" />
        <Switch size="sm" label="Tinted selection" checked={soft} onCheckedChange={setSoft} />
      </div>
      <div className="flex h-[34rem] overflow-hidden rounded-2xl bg-bg shadow-[inset_0_0_0_1px_var(--pl-separator)]">
        <Sidebar
          sticky={false}
          variant="surface"
          label="Demo navigation"
          open={open}
          onOpenChange={setOpen}
          collapsed={collapsed}
          selection={soft ? "soft" : "filled"}
        >
          <SidebarHeader>
            <span className="grid size-8 shrink-0 place-items-center rounded-[30%] bg-accent text-headline text-on-accent">W</span>
            {!collapsed && <span className="text-headline">Wayfare</span>}
          </SidebarHeader>
          <SidebarSearch placeholder="Search" />
          <SidebarContent>
            {GROUPS.map((group) => (
              <SidebarGroup key={group.label} label={group.label} icon={group.icon} collapsible>
                {group.items.map((item) => (
                  <SidebarItem key={item.id} icon={item.icon} badge={item.badge} active={active === item.id} onClick={() => setActive(item.id)}>
                    {item.id}
                  </SidebarItem>
                ))}
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <ul>
              <SidebarItem icon={<Settings />} active={active === "Settings"} onClick={() => setActive("Settings")}>
                Settings
              </SidebarItem>
            </ul>
            <div className="flex items-center gap-3 px-1 pt-1">
              <Avatar name="Sofia Rossi" size="sm" />
              {!collapsed && (
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-subhead">Sofia Rossi</span>
                  <span className="truncate text-footnote text-fg-muted">sofia@wayfare.app</span>
                </span>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="grid flex-1 place-items-center p-6 text-center">
          <p className="flex flex-col gap-1">
            <span className="text-title2">{active}</span>
            <span className="text-subhead text-fg-muted">Type in Search to filter. Below lg this is a drawer.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
