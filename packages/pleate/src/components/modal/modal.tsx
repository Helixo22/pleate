// Modal: a dialog over the page (Radix Dialog: focus trap, Escape, scroll lock, labelled by its title). Centered and
// zooming in on desktop; on phones it becomes a sheet sliding up from the bottom (mobile="sheet", default) or stays
// centered. Compose ModalHeader / ModalTitle / ModalDescription / ModalBody / ModalFooter.
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Dialog } from "radix-ui";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { XIcon } from "../../lib/icons.tsx";
import { overlayBackdrop, overlaySurface, sheetCloseButton } from "../../lib/overlay-styles.ts";

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;

const contentVariants = cva(
  [
    `fixed z-(--pl-z-modal) flex flex-col overflow-hidden outline-none ${overlaySurface}`,
  ],
  {
    variants: {
      mobile: {
        sheet: "max-md:pl-dialog-sheet inset-x-0 bottom-0 max-h-[94dvh] rounded-t-2xl pb-(--pl-safe-bottom) md:pl-dialog",
        center: "pl-dialog inset-x-4 top-1/2 max-h-[88dvh] -translate-y-1/2 rounded-2xl",
      },
      size: {
        sm: "md:max-w-sm",
        md: "md:max-w-lg",
        lg: "md:max-w-2xl",
        xl: "md:max-w-4xl",
        full: "md:max-w-none",
      },
    },
    defaultVariants: { mobile: "sheet", size: "md" },
  },
);

const desktop =
  "md:inset-x-auto md:start-1/2 md:top-1/2 md:bottom-auto md:w-[calc(100%-3rem)] md:max-h-[85dvh] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:pb-0 rtl:md:translate-x-1/2";

export type ModalContentProps = ComponentProps<typeof Dialog.Content> &
  VariantProps<typeof contentVariants> & {
    /** × button in the top corner. */
    showClose?: boolean;
    closeLabel?: string;
  };

export function ModalContent({ className, size, mobile = "sheet", showClose = true, closeLabel = "Close", children, ...props }: ModalContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className={overlayBackdrop} />
      <Dialog.Content className={cn(contentVariants({ size, mobile }), desktop, size === "full" && "md:h-[85dvh]", className)} {...props}>
        {children}
        {showClose && (
          <Dialog.Close className={cn(sheetCloseButton, "absolute end-3 top-3")} aria-label={closeLabel}>
            <XIcon strokeWidth={2} />
          </Dialog.Close>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

type DivProps = HTMLAttributes<HTMLDivElement>;

/** `icon` renders a soft round tile before the title and description, like AlertDialog. */
export function ModalHeader({ className, icon, danger, children, ...props }: DivProps & { icon?: ReactNode; danger?: boolean }) {
  if (!icon) return <div className={cn("flex shrink-0 flex-col gap-1 px-6 pt-5 pe-12 pb-2", className)} {...props}>{children}</div>;
  return (
    <div className={cn("flex shrink-0 items-start gap-4 px-6 pt-5 pe-12 pb-2", className)} {...props}>
      <span
        aria-hidden="true"
        className={cn("grid size-12 shrink-0 place-items-center rounded-full [&_svg]:size-5", danger ? "bg-danger-soft text-danger-ink" : "bg-accent-soft text-accent-ink")}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
    </div>
  );
}

export function ModalTitle({ className, ...props }: ComponentProps<typeof Dialog.Title>) {
  return <Dialog.Title className={cn("text-headline text-fg", className)} {...props} />;
}

export function ModalDescription({ className, ...props }: ComponentProps<typeof Dialog.Description>) {
  return <Dialog.Description className={cn("text-subhead text-fg-muted", className)} {...props} />;
}

export function ModalBody({ className, ...props }: DivProps) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-2 text-body", className)} {...props} />;
}

export function ModalFooter({ className, ...props }: DivProps) {
  return (
    <div
      className={cn("flex shrink-0 flex-col-reverse gap-2 px-6 pt-4 pb-5 md:flex-row md:justify-end [&>*]:max-md:w-full", className)}
      {...props}
    />
  );
}
