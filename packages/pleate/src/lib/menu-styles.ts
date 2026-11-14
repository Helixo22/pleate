// Shared look of Menu and ContextMenu: a compact panel with a hairline ring, 36px rows (44px on touch) in subhead text,
// icons leading in a muted color, destructive rows in red, a thin line between groups, shortcuts trailing in mono.
export const menuContent =
  "pl-pop z-(--pl-z-dropdown) min-w-48 max-w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-xl bg-elevated p-1 text-fg shadow-[var(--pl-shadow-lg),var(--pl-edge)] outline-none " +
  "max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto";

export const menuItem =
  "pl-touch relative flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-subhead outline-none select-none pointer-coarse:min-h-11 " +
  "transition-colors duration-(--pl-duration-instant) data-highlighted:bg-fill-2 data-disabled:pointer-events-none data-disabled:opacity-40 " +
  "[&_svg]:size-4 [&_svg]:shrink-0 [&>svg]:text-fg-muted";

export const menuItemDestructive = "text-danger-ink data-highlighted:bg-danger-soft [&>svg]:text-danger-ink";
export const menuInset = "ps-9";
export const menuIndicator = "absolute start-2.5 flex size-4 items-center justify-center text-fg";
export const menuLabel = "px-2.5 pt-2 pb-1 text-caption1 font-medium text-fg-subtle";
export const menuSeparator = "-mx-1 my-1 h-px bg-separator-raised";
export const menuShortcut = "ms-auto ps-4 font-mono text-footnote text-fg-muted";
