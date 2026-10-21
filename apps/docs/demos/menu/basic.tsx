"use client";

import { Copy, Ellipsis, Pencil, Share, Trash2, UserPlus } from "lucide-react";
import { IconButton } from "pleate/icon-button";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "pleate/menu";
import { useState } from "react";

export default function Demo() {
  const [sort, setSort] = useState("date");
  const [offline, setOffline] = useState(true);
  return (
    <Menu>
      <MenuTrigger asChild>
        <IconButton aria-label="Trip actions" icon={<Ellipsis />} />
      </MenuTrigger>
      <MenuContent>
        <MenuItem icon={<Pencil />} shortcut="⌘E">Rename</MenuItem>
        <MenuItem icon={<Copy />} shortcut="⌘D">Duplicate</MenuItem>
        <MenuSub>
          <MenuSubTrigger icon={<Share />}>Share</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Copy link</MenuItem>
            <MenuItem>Email</MenuItem>
            <MenuItem>Messages</MenuItem>
          </MenuSubContent>
        </MenuSub>
        <MenuItem icon={<UserPlus />}>Invite travellers</MenuItem>
        <MenuSeparator />
        <MenuLabel>Sort by</MenuLabel>
        <MenuRadioGroup value={sort} onValueChange={setSort}>
          <MenuRadioItem value="date">Date</MenuRadioItem>
          <MenuRadioItem value="name">Name</MenuRadioItem>
          <MenuRadioItem value="price">Price</MenuRadioItem>
        </MenuRadioGroup>
        <MenuSeparator />
        <MenuCheckboxItem checked={offline} onCheckedChange={setOffline}>
          Available offline
        </MenuCheckboxItem>
        <MenuSeparator />
        <MenuItem destructive icon={<Trash2 />}>Delete trip</MenuItem>
      </MenuContent>
    </Menu>
  );
}
