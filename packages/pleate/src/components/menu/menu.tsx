// Menu: an action menu opened from a trigger (Radix DropdownMenu) with the iOS look. Items take a trailing icon,
// a shortcut and a destructive tone; checkbox and radio items show a leading checkmark; submenus open sideways.
// Full keyboard support and typeahead come from Radix.
"use client";

import { DropdownMenu } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { CheckIcon, ChevronRightIcon } from "../../lib/icons.tsx";
import {
  menuContent,
  menuIndicator,
  menuInset,
  menuItem,
  menuItemDestructive,
  menuLabel,
  menuSeparator,
  menuShortcut,
} from "../../lib/menu-styles.ts";

export const Menu = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;
export const MenuGroup = DropdownMenu.Group;
export const MenuRadioGroup = DropdownMenu.RadioGroup;
export const MenuSub = DropdownMenu.Sub;

export function MenuContent({ className, sideOffset = 6, align = "start", collisionPadding = 8, ...props }: ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content sideOffset={sideOffset} align={align} collisionPadding={collisionPadding} className={cn(menuContent, className)} {...props} />
    </DropdownMenu.Portal>
  );
}

export type MenuItemProps = ComponentProps<typeof DropdownMenu.Item> & {
  icon?: ReactNode;
  shortcut?: ReactNode;
  destructive?: boolean;
  /** Indent to line up with checkbox/radio items. */
  inset?: boolean;
};

export function MenuItem({ className, icon, shortcut, destructive, inset, children, ...props }: MenuItemProps) {
  return (
    <DropdownMenu.Item className={cn(menuItem, destructive && menuItemDestructive, inset && menuInset, className)} {...props}>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <span className={menuShortcut}>{shortcut}</span>}
      {icon}
    </DropdownMenu.Item>
  );
}

export function MenuCheckboxItem({ className, children, icon, ...props }: ComponentProps<typeof DropdownMenu.CheckboxItem> & { icon?: ReactNode }) {
  return (
    <DropdownMenu.CheckboxItem className={cn(menuItem, menuInset, className)} {...props}>
      <span className={menuIndicator}>
        <DropdownMenu.ItemIndicator>
          <CheckIcon strokeWidth={2.75} className="size-4" />
        </DropdownMenu.ItemIndicator>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {icon}
    </DropdownMenu.CheckboxItem>
  );
}

export function MenuRadioItem({ className, children, icon, ...props }: ComponentProps<typeof DropdownMenu.RadioItem> & { icon?: ReactNode }) {
  return (
    <DropdownMenu.RadioItem className={cn(menuItem, menuInset, className)} {...props}>
      <span className={menuIndicator}>
        <DropdownMenu.ItemIndicator>
          <CheckIcon strokeWidth={2.75} className="size-4" />
        </DropdownMenu.ItemIndicator>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {icon}
    </DropdownMenu.RadioItem>
  );
}

export function MenuLabel({ className, ...props }: ComponentProps<typeof DropdownMenu.Label>) {
  return <DropdownMenu.Label className={cn(menuLabel, className)} {...props} />;
}

export function MenuSeparator({ className, ...props }: ComponentProps<typeof DropdownMenu.Separator>) {
  return <DropdownMenu.Separator className={cn(menuSeparator, className)} {...props} />;
}

export function MenuSubTrigger({ className, children, icon, ...props }: ComponentProps<typeof DropdownMenu.SubTrigger> & { icon?: ReactNode }) {
  return (
    <DropdownMenu.SubTrigger className={cn(menuItem, "data-[state=open]:bg-fill-2", className)} {...props}>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {icon}
      <ChevronRightIcon className="text-fg-subtle rtl:rotate-180" strokeWidth={2.5} />
    </DropdownMenu.SubTrigger>
  );
}

export function MenuSubContent({ className, sideOffset = 4, collisionPadding = 8, ...props }: ComponentProps<typeof DropdownMenu.SubContent>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.SubContent sideOffset={sideOffset} collisionPadding={collisionPadding} className={cn(menuContent, className)} {...props} />
    </DropdownMenu.Portal>
  );
}
