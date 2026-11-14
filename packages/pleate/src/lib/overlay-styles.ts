// Shared overlay pieces: the dimmed backdrop and the close button of dialogs and sheets.
export const overlayBackdrop = "pl-fade fixed inset-0 z-(--pl-z-modal) bg-overlay";

export const closeButton =
  "pl-focus-ring pl-touch pl-hit relative grid size-7 shrink-0 cursor-pointer place-items-center rounded-sm text-fg-subtle " +
  "transition-colors hover:bg-fill-2 hover:text-fg [&_svg]:size-4";

/** Close button of dialogs, drawers and sheets: a small gray circle with an ×. */
export const sheetCloseButton =
  "pl-focus-ring pl-touch pl-hit relative grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-fill-2 text-fg-muted " +
  "transition-colors hover:bg-fill hover:text-fg [&_svg]:size-4";

/** Floating panels (dialogs, popovers, menus, toasts): solid surface, a hairline ring and a soft shadow. */
export const overlaySurface = "bg-elevated text-fg shadow-[var(--pl-shadow-xl),var(--pl-edge)]";

/** Hairline on raised surfaces (alerts, sheets): --pl-separator matches --pl-elevated in dark, so mix it from the text color. */
export const hairline = "[--pl-hair:var(--pl-separator-raised)]";
