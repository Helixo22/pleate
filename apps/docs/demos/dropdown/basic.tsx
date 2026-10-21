"use client";

import { ArrowDownAZ, CalendarDays, Euro, LogOut, Settings, User } from "lucide-react";
import { Avatar } from "pleate/avatar";
import { Dropdown } from "pleate/dropdown";
import { useState } from "react";

export default function Demo() {
  const [sort, setSort] = useState("Date");
  return (
    <>
      <Dropdown
        label={`Sort: ${sort}`}
        items={[
          { label: "Date", icon: <CalendarDays />, onSelect: () => setSort("Date") },
          { label: "Name", icon: <ArrowDownAZ />, onSelect: () => setSort("Name") },
          { label: "Price", icon: <Euro />, onSelect: () => setSort("Price") },
        ]}
      />
      <Dropdown
        align="end"
        trigger={
          <button type="button" aria-label="Account" className="pl-focus-ring cursor-pointer rounded-full">
            <Avatar name="Sofia Rossi" />
          </button>
        }
        items={[
          { type: "label", label: "sofia@helpintrip.es" },
          { label: "Profile", icon: <User /> },
          { label: "Settings", icon: <Settings />, shortcut: "⌘," },
          { type: "separator" },
          { label: "Sign out", icon: <LogOut />, destructive: true },
        ]}
      />
    </>
  );
}
