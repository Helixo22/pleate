// ActionSheet: the iOS action sheet, a short list of choices rising from the bottom, with a separate Cancel button.
// Destructive actions are red. On wider screens it appears as a centered card. Radix Dialog underneath.
"use client";

import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { overlayBackdrop } from "../../lib/overlay-styles.ts";

export type ActionSheetAction = {
  label: ReactNode;
  onSelect?: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
};

export type ActionSheetProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title?: ReactNode;
  message?: ReactNode;
  actions: ActionSheetAction[];
  cancelLabel?: ReactNode;
};

const row =
  "pl-focus-ring pl-touch flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 px-4 text-title3 font-normal text-accent-ink " +
  "outline-offset-[-2px] transition-colors hover:bg-fill-3 active:bg-fill-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-5";

export function ActionSheet({ open, defaultOpen, onOpenChange, trigger, title, message, actions, cancelLabel = "Cancel" }: ActionSheetProps) {
  return (
    <Dialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className={overlayBackdrop} />
        <Dialog.Content
          {...(!message && { "aria-describedby": undefined })}
          // Focus the sheet itself, not its first action: no focus ring flashing on open; Tab still enters it.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }}
          className={cn(
            "fixed inset-x-0 bottom-0 z-(--pl-z-modal) mx-auto flex w-full max-w-md flex-col gap-2 px-2 pb-[max(0.5rem,var(--pl-safe-bottom))] outline-none",
            "max-md:pl-dialog-sheet md:pl-dialog md:top-1/2 md:bottom-auto md:-translate-y-1/2",
          )}
        >
          <div className="overflow-hidden rounded-2xl bg-elevated">
            {(title || message) && (
              <div className="flex flex-col gap-1 border-b border-separator px-4 py-3.5 text-center">
                {title ? (
                  <Dialog.Title className="text-footnote font-semibold text-fg-muted">{title}</Dialog.Title>
                ) : (
                  <Dialog.Title className="sr-only">Actions</Dialog.Title>
                )}
                {message && <Dialog.Description className="text-footnote text-fg-muted">{message}</Dialog.Description>}
              </div>
            )}
            {!title && !message && <Dialog.Title className="sr-only">Actions</Dialog.Title>}
            <div className="flex flex-col divide-y divide-separator">
              {actions.map((action, i) => (
                <Dialog.Close
                  key={i}
                  disabled={action.disabled}
                  onClick={action.onSelect}
                  className={cn(row, action.destructive && "text-danger-ink")}
                >
                  {action.icon}
                  {action.label}
                </Dialog.Close>
              ))}
            </div>
          </div>
          <Dialog.Close className={cn(row, "rounded-2xl bg-elevated font-semibold")}>{cancelLabel}</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
