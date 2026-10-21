// Modal: a dialog over the page (Radix Dialog: focus trap, Escape, scroll lock, labelled by its title). Centered and
// zooming in on desktop; on phones it becomes a sheet sliding up from the bottom (mobile="sheet", default) or stays
// centered. Compose ModalHeader / ModalTitle / ModalDescription / ModalBody / ModalFooter.
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Dialog } from "radix-ui";
import { createContext, useContext, type ComponentProps, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { XIcon } from "../../lib/icons.tsx";
import { closeButton, overlayBackdrop } from "../../lib/overlay-styles.ts";

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;

const contentVariants = cva(
  [
    "fixed z-(--pl-z-modal) flex flex-col overflow-hidden bg-elevated text-fg shadow-xl outline-none",
  ],
  {
    variants: {
      mobile: {
        sheet: "max-md:pl-dialog-sheet inset-x-0 bottom-0 max-h-[94dvh] rounded-t-3xl pb-(--pl-safe-bottom) md:pl-dialog",
        center: "pl-dialog inset-x-4 top-1/2 max-h-[88dvh] -translate-y-1/2 rounded-3xl",
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
  "md:inset-x-auto md:start-1/2 md:top-1/2 md:bottom-auto md:w-[calc(100%-3rem)] md:max-h-[85dvh] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:pb-0 rtl:md:translate-x-1/2";

const ModalContext = createContext<{ mobile: "sheet" | "center" }>({ mobile: "sheet" });

export type ModalContentProps = ComponentProps<typeof Dialog.Content> &
  VariantProps<typeof contentVariants> & {
    /** Round × in the top corner. */
    showClose?: boolean;
    closeLabel?: string;
  };

export function ModalContent({ className, size, mobile = "sheet", showClose = true, closeLabel = "Close", children, ...props }: ModalContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className={overlayBackdrop} />
      <Dialog.Content className={cn(contentVariants({ size, mobile }), desktop, size === "full" && "md:h-[85dvh]", className)} {...props}>
        <ModalContext.Provider value={{ mobile: mobile ?? "sheet" }}>
          {mobile === "sheet" && <div aria-hidden="true" className="mx-auto mt-2 h-1.5 w-9 shrink-0 rounded-full bg-fill md:hidden" />}
          {children}
          {showClose && (
            <Dialog.Close className={cn(closeButton, "absolute end-4 top-4")} aria-label={closeLabel}>
              <XIcon strokeWidth={2.5} />
            </Dialog.Close>
          )}
        </ModalContext.Provider>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

type DivProps = HTMLAttributes<HTMLDivElement>;

export function ModalHeader({ className, ...props }: DivProps) {
  const { mobile } = useContext(ModalContext);
  return <div className={cn("flex shrink-0 flex-col gap-1.5 px-6 pt-6 pe-14 pb-2", mobile === "sheet" && "max-md:pt-3", className)} {...props} />;
}

export function ModalTitle({ className, ...props }: ComponentProps<typeof Dialog.Title>) {
  return <Dialog.Title className={cn("text-title3 text-fg", className)} {...props} />;
}

export function ModalDescription({ className, ...props }: ComponentProps<typeof Dialog.Description>) {
  return <Dialog.Description className={cn("text-subhead text-fg-muted", className)} {...props} />;
}

export function ModalBody({ className, ...props }: DivProps) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-3 text-body", className)} {...props} />;
}

export function ModalFooter({ className, ...props }: DivProps) {
  return (
    <div
      className={cn("flex shrink-0 flex-col-reverse gap-2 px-6 pt-3 pb-6 md:flex-row md:justify-end [&>*]:max-md:w-full", className)}
      {...props}
    />
  );
}
