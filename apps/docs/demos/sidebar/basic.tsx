"use client";

import { CalendarDays, Compass, Heart, Inbox, Menu, Settings } from "lucide-react";
import { Avatar } from "pleate/avatar";
import { Badge } from "pleate/badge";
import { Button } from "pleate/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarItem } from "pleate/sidebar";
import { Switch } from "pleate/switch";
import { useState } from "react";

const ITEMS = [
  { id: "explore", label: "Explore", icon: <Compass /> },
  { id: "trips", label: "Trips", icon: <CalendarDays />, badge: 3 },
  { id: "saved", label: "Saved", icon: <Heart /> },
  { id: "inbox", label: "Inbox", icon: <Inbox />, badge: <Badge size="sm" variant="solid" tone="danger">2</Badge> },
];

export default function Demo() {
  const [active, setActive] = useState("explore");
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [filled, setFilled] = useState(false);
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Button size="sm" variant="gray" startIcon={<Menu />} onClick={() => setOpen(true)} className="lg:hidden">
          Open drawer
        </Button>
        <Switch size="sm" label="Collapsed" checked={collapsed} onCheckedChange={setCollapsed} className="hidden lg:inline-flex" />
        <Switch size="sm" label="Filled selection" checked={filled} onCheckedChange={setFilled} />
      </div>
      <div className="flex h-[30rem] overflow-hidden rounded-2xl bg-bg shadow-[inset_0_0_0_1px_var(--pl-separator)]">
        <Sidebar
          sticky={false}
          variant="surface"
          label="Demo navigation"
          open={open}
          onOpenChange={setOpen}
          collapsed={collapsed}
          selection={filled ? "filled" : "soft"}
        >
          <SidebarHeader>
            <span className="grid size-8 place-items-center rounded-[30%] bg-accent text-headline text-on-accent">h</span>
            {!collapsed && <span className="text-headline">helpintrip</span>}
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup label="Plan">
              {ITEMS.map((item) => (
                <SidebarItem key={item.id} icon={item.icon} badge={item.badge} active={active === item.id} onClick={() => setActive(item.id)}>
                  {item.label}
                </SidebarItem>
              ))}
            </SidebarGroup>
            <SidebarGroup label="Account">
              <SidebarItem icon={<Settings />} active={active === "settings"} onClick={() => setActive("settings")}>
                Settings
              </SidebarItem>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center gap-3 px-1">
              <Avatar name="Sofia Rossi" size="sm" />
              {!collapsed && <span className="truncate text-subhead">Sofia Rossi</span>}
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="grid flex-1 place-items-center p-6 text-center text-subhead text-fg-muted">
          <p>
            <span className="block text-title2 text-fg capitalize">{active}</span>
            Below lg the sidebar becomes a drawer.
          </p>
        </div>
      </div>
    </div>
  );
}
