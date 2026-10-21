// Dropdown: a Menu described as data — a trigger (any element, or a Button made from `label`) plus a list of
// actions, separators, labels and submenus. For anything custom, compose Menu directly.
"use client";

import type { ReactNode } from "react";
import { ChevronDownIcon } from "../../lib/icons.tsx";
import { Button, type ButtonProps } from "../button/button.tsx";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "../menu/menu.tsx";

export type DropdownEntry =
  | { type?: "item"; label: ReactNode; onSelect?: () => void; icon?: ReactNode; shortcut?: ReactNode; destructive?: boolean; disabled?: boolean }
  | { type: "separator" }
  | { type: "label"; label: ReactNode }
  | { type: "submenu"; label: ReactNode; icon?: ReactNode; items: DropdownEntry[] };

export type DropdownProps = {
  items: DropdownEntry[];
  /** Your own trigger element (a Button, IconButton, Avatar…). */
  trigger?: ReactNode;
  /** Or a Button with this text and a chevron. */
  label?: ReactNode;
  buttonProps?: Omit<ButtonProps, "children">;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function renderEntries(items: DropdownEntry[]): ReactNode {
  return items.map((entry, i) => {
    if (entry.type === "separator") return <MenuSeparator key={i} />;
    if (entry.type === "label") return <MenuLabel key={i}>{entry.label}</MenuLabel>;
    if (entry.type === "submenu") {
      return (
        <MenuSub key={i}>
          <MenuSubTrigger icon={entry.icon}>{entry.label}</MenuSubTrigger>
          <MenuSubContent>{renderEntries(entry.items)}</MenuSubContent>
        </MenuSub>
      );
    }
    return (
      <MenuItem
        key={i}
        icon={entry.icon}
        shortcut={entry.shortcut}
        destructive={entry.destructive}
        disabled={entry.disabled}
        onSelect={entry.onSelect}
      >
        {entry.label}
      </MenuItem>
    );
  });
}

export function Dropdown({ items, trigger, label, buttonProps, align = "start", side, open, onOpenChange }: DropdownProps) {
  return (
    <Menu open={open} onOpenChange={onOpenChange}>
      <MenuTrigger asChild>
        {trigger ?? (
          <Button variant="gray" tone="neutral" endIcon={<ChevronDownIcon />} {...buttonProps}>
            {label}
          </Button>
        )}
      </MenuTrigger>
      <MenuContent align={align} side={side}>
        {renderEntries(items)}
      </MenuContent>
    </Menu>
  );
}
