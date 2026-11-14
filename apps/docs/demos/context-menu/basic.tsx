"use client";

import { Copy, Heart, Share, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "pleate/context-menu";
import { useState } from "react";

export default function Demo() {
  const [offline, setOffline] = useState(true);
  return (
    <ContextMenu>
      <ContextMenuTrigger className="grid h-40 w-full max-w-sm place-items-center rounded-lg border border-dashed border-border bg-surface-2 text-center text-subhead text-fg-muted">
        Right-click or long-press
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Lisbon, 4 nights</ContextMenuLabel>
        <ContextMenuItem icon={<Heart />}>Save</ContextMenuItem>
        <ContextMenuItem icon={<Copy />} shortcut="⌘C">Copy link</ContextMenuItem>
        <ContextMenuItem icon={<Share />}>Share…</ContextMenuItem>
        <ContextMenuCheckboxItem checked={offline} onCheckedChange={setOffline}>Available offline</ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuItem destructive icon={<Trash2 />}>Remove</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
