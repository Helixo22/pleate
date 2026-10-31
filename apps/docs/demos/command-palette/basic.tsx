"use client";

import { CalendarPlus, Hotel, MapPin, Plane, Plus, Settings, UserPlus } from "lucide-react";
import { Button } from "pleate/button";
import { CommandPalette } from "pleate/command-palette";
import { Kbd } from "pleate/kbd";
import { useState, type ReactNode } from "react";

export default function Demo() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const item = (id: string, label: string, icon: ReactNode, extra?: { shortcut?: string; keywords?: string[] }) => ({
    id,
    label,
    icon,
    ...extra,
    onSelect: () => setLast(label),
  });

  return (
    <div className="grid justify-items-center gap-3">
      <Button variant="surface" tone="neutral" onClick={() => setOpen(true)} endIcon={<Kbd keys="mod+k" />}>
        Search trips
      </Button>
      <p className="text-footnote text-fg-muted" aria-live="polite">
        {last ? `Last action: ${last}` : "Or press the shortcut anywhere on this page"}
      </p>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        placeholder="Search trips and actions"
        groups={[
          {
            heading: "Trips",
            items: [
              item("lisbon", "Weekend in Lisbon", <MapPin />, { keywords: ["portugal", "may"] }),
              item("kyoto", "Kyoto in spring", <MapPin />, { keywords: ["japan", "april"] }),
              item("porto", "Porto and the Douro", <MapPin />, { keywords: ["portugal", "wine"] }),
            ],
          },
          {
            heading: "Actions",
            items: [
              item("new-trip", "New trip", <Plus />, { shortcut: "mod+n" }),
              item("flight", "Add a flight", <Plane />, { keywords: ["booking"] }),
              item("hotel", "Add a stay", <Hotel />, { keywords: ["booking", "hotel"] }),
              item("dates", "Change dates", <CalendarPlus />),
              item("invite", "Invite travellers", <UserPlus />, { shortcut: "mod+i", keywords: ["share"] }),
            ],
          },
          { heading: "Settings", items: [item("settings", "Preferences", <Settings />, { shortcut: "mod+," })] },
        ]}
      />
    </div>
  );
}
