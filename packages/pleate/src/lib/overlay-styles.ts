// Shared overlay pieces: the dimmed backdrop and the round close button of dialogs and sheets.
export const overlayBackdrop = "pl-fade fixed inset-0 z-(--pl-z-modal) bg-overlay";

export const closeButton =
  "pl-focus-ring pl-touch grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-fill-2 text-fg-muted " +
  "transition-colors hover:bg-fill hover:text-fg [&_svg]:size-4";
