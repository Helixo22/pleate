// Shared look of Menu and ContextMenu: a compact bordered panel, 32px rows (40px on touch), icons leading at one
// size, destructive rows in red, hairline separators and shortcuts in mono.
export const menuContent =
  "pl-pop z-(--pl-z-dropdown) min-w-48 max-w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-lg bg-elevated p-1 text-fg shadow-lg outline-none " +
  "max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto";

export const menuItem =
  "pl-touch relative flex min-h-8 cursor-pointer items-center gap-2 rounded-sm px-2 text-subhead outline-none select-none pointer-coarse:min-h-10 " +
  "transition-colors duration-(--pl-duration-instant) data-highlighted:bg-fill-2 data-disabled:pointer-events-none data-disabled:opacity-40 " +
  "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-subtle data-highlighted:[&_svg]:text-fg";

export const menuItemDestructive = "text-danger-ink data-highlighted:bg-danger-soft [&_svg]:text-danger-ink";
export const menuInset = "ps-8";
export const menuIndicator = "absolute start-2 flex size-4 items-center justify-center text-accent-ink";
export const menuLabel = "px-2 pt-2 pb-1 text-caption1 font-medium text-fg-subtle";
export const menuSeparator = "-mx-1 my-1 h-px bg-separator";
export const menuShortcut = "ms-auto ps-4 font-mono text-caption1 text-fg-subtle";
