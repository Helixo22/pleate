// Shared look of Menu and ContextMenu, after the iOS context menu: a wide rounded panel, 40px rows (44px on touch) in
// callout text, icons at the trailing end in the text color, destructive rows in red, a thick band between groups,
// checkmarks leading and shortcuts in mono.
export const menuContent =
  "pl-pop z-(--pl-z-dropdown) min-w-60 max-w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-lg bg-elevated p-1.5 text-fg shadow-lg outline-none " +
  "max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto";

export const menuItem =
  "pl-touch relative flex min-h-10 cursor-pointer items-center gap-3 rounded-sm px-3 text-callout outline-none select-none pointer-coarse:min-h-11 " +
  "transition-colors duration-(--pl-duration-instant) data-highlighted:bg-fill-2 data-disabled:pointer-events-none data-disabled:opacity-40 " +
  "[&_svg]:size-[1.125rem] [&_svg]:shrink-0";

export const menuItemDestructive = "text-danger-ink data-highlighted:bg-danger-soft";
export const menuInset = "ps-9";
export const menuIndicator = "absolute start-3 flex size-4 items-center justify-center text-fg";
export const menuLabel = "px-3 pt-2 pb-1 text-footnote text-fg-muted";
/** Between groups: a thick band, as in iOS menus. */
export const menuSeparator = "-mx-1.5 my-1.5 h-2 bg-black/[0.06] dark:bg-black/35";
export const menuShortcut = "ms-auto ps-4 font-mono text-footnote text-fg-muted";
