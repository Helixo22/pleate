// Shared look of Menu and ContextMenu: an iOS context menu, wide rounded panel, 44px rows, icons trailing,
// destructive rows in red, thick gaps between groups.
export const menuContent =
  "pl-pop z-(--pl-z-dropdown) min-w-56 max-w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-xl bg-elevated p-1.5 text-fg shadow-xl outline-none " +
  "max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto";

export const menuItem =
  "pl-touch relative flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-body outline-none select-none " +
  "transition-colors duration-(--pl-duration-instant) data-highlighted:bg-fill-2 data-disabled:pointer-events-none data-disabled:opacity-40 " +
  "[&_svg]:size-[1.125rem] [&_svg]:shrink-0";

export const menuItemDestructive = "text-danger-ink data-highlighted:bg-danger-soft";
export const menuInset = "ps-9";
export const menuIndicator = "absolute start-3 flex size-4 items-center justify-center text-accent-ink";
export const menuLabel = "px-3 pt-2 pb-1 text-footnote font-semibold text-fg-muted";
export const menuSeparator = "-mx-1.5 my-1.5 h-1.5 bg-fill-3";
export const menuShortcut = "ms-auto ps-4 text-footnote tracking-wide text-fg-subtle";
