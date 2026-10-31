"use client";

import { CalendarDays, Compass, House, Search, Ticket } from "lucide-react";
import { CommandPalette } from "pleate/command-palette";
import { IconButton } from "pleate/icon-button";
import { TabBar, TabBarItem } from "pleate/tab-bar";
import { useState } from "react";

const TABS = [
  { value: "home", label: "Home", icon: <House /> },
  { value: "explore", label: "Explore", icon: <Compass /> },
  { value: "trips", label: "Trips", icon: <CalendarDays />, badge: 2 },
  { value: "tickets", label: "Tickets", icon: <Ticket /> },
];

export default function Demo() {
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState(false);
  const go = (value: string) => () => setTab(value);
  return (
    <div className="flex h-[30rem] w-full max-w-[22rem] flex-col overflow-hidden rounded-[2.5rem] bg-bg shadow-[inset_0_0_0_1px_var(--pl-separator)]">
      <div className="flex-1 overflow-y-auto px-5 pt-8">
        <p className="font-mono text-caption1 text-fg-subtle">{TABS.find((t) => t.value === tab)?.label}</p>
        <h3 className="mt-1 text-title2">Weekend in Lisbon</h3>
        <p className="mt-1 text-subhead text-fg-muted">14 to 17 Nov · 4 travellers</p>
      </div>

      {/* Search is an action, not a place: it sits in its own pane and opens the palette in place. */}
      <TabBar
        position="static"
        variant="floating"
        value={tab}
        onValueChange={setTab}
        label="Sections"
        trailing={<IconButton aria-label="Search" aria-haspopup="dialog" variant="plain" tone="neutral" size="lg" icon={<Search />} onClick={() => setSearch(true)} />}
      >
        {TABS.map((item) => (
          <TabBarItem key={item.value} {...item} />
        ))}
      </TabBar>

      <CommandPalette
        open={search}
        onOpenChange={setSearch}
        shortcut={false}
        placeholder="Search trips and places"
        groups={[
          {
            heading: "Go to",
            items: TABS.map((t) => ({ id: t.value, label: t.label, onSelect: go(t.value) })),
          },
          {
            heading: "Trips",
            items: [
              { id: "lisbon", label: "Weekend in Lisbon", keywords: ["portugal"], onSelect: go("trips") },
              { id: "kyoto", label: "Kyoto in spring", keywords: ["japan"], onSelect: go("trips") },
            ],
          },
        ]}
      />
    </div>
  );
}
