// ContextMenu: the same iOS menu, opened by right click on desktop and long press on touch screens.
"use client";

import { ContextMenu as ContextMenuPrimitive } from "radix-ui";
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

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuGroup = ContextMenuPrimitive.Group;
export const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;
export const ContextMenuSub = ContextMenuPrimitive.Sub;

export function ContextMenuTrigger({ className, ...props }: ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return <ContextMenuPrimitive.Trigger className={cn("pl-touch", className)} {...props} />;
}

export function ContextMenuContent({ className, collisionPadding = 8, ...props }: ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        collisionPadding={collisionPadding}
        className={cn(menuContent, "max-h-(--radix-context-menu-content-available-height) [--radix-popper-transform-origin:var(--radix-context-menu-content-transform-origin)]", className)}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

export function ContextMenuItem({
  className,
  icon,
  shortcut,
  destructive,
  inset,
  children,
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.Item> & { icon?: ReactNode; shortcut?: ReactNode; destructive?: boolean; inset?: boolean }) {
  return (
    <ContextMenuPrimitive.Item className={cn(menuItem, destructive && menuItemDestructive, inset && menuInset, className)} {...props}>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <span className={menuShortcut}>{shortcut}</span>}
      {icon}
    </ContextMenuPrimitive.Item>
  );
}

export function ContextMenuCheckboxItem({ className, children, ...props }: ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>) {
  return (
    <ContextMenuPrimitive.CheckboxItem className={cn(menuItem, menuInset, className)} {...props}>
      <span className={menuIndicator}>
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon strokeWidth={2.75} className="size-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </ContextMenuPrimitive.CheckboxItem>
  );
}

export function ContextMenuRadioItem({ className, children, ...props }: ComponentProps<typeof ContextMenuPrimitive.RadioItem>) {
  return (
    <ContextMenuPrimitive.RadioItem className={cn(menuItem, menuInset, className)} {...props}>
      <span className={menuIndicator}>
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon strokeWidth={2.75} className="size-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </ContextMenuPrimitive.RadioItem>
  );
}

export function ContextMenuLabel({ className, ...props }: ComponentProps<typeof ContextMenuPrimitive.Label>) {
  return <ContextMenuPrimitive.Label className={cn(menuLabel, className)} {...props} />;
}

export function ContextMenuSeparator({ className, ...props }: ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return <ContextMenuPrimitive.Separator className={cn(menuSeparator, className)} {...props} />;
}

export function ContextMenuSubTrigger({ className, children, ...props }: ComponentProps<typeof ContextMenuPrimitive.SubTrigger>) {
  return (
    <ContextMenuPrimitive.SubTrigger className={cn(menuItem, "data-[state=open]:bg-fill-2", className)} {...props}>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ChevronRightIcon className="text-fg-subtle rtl:rotate-180" strokeWidth={2.5} />
    </ContextMenuPrimitive.SubTrigger>
  );
}

export function ContextMenuSubContent({ className, ...props }: ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent className={cn(menuContent, className)} {...props} />
    </ContextMenuPrimitive.Portal>
  );
}
