// Shared overlay pieces: the dimmed backdrop and the close button of dialogs and sheets.
export const overlayBackdrop = "pl-fade fixed inset-0 z-(--pl-z-modal) bg-overlay";

export const closeButton =
  "pl-focus-ring pl-touch pl-hit relative grid size-7 shrink-0 cursor-pointer place-items-center rounded-sm text-fg-subtle " +
  "transition-colors hover:bg-fill-2 hover:text-fg [&_svg]:size-4";
