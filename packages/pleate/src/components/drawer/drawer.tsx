// Drawer: a panel that slides in from an edge (Radix Dialog: focus trap, Escape, scroll lock, labelled by its title).
// side="start" | "end" for full-height panels (filters, details, a booking summary), "bottom" for a sheet across the
// width. Same parts as Modal: DrawerHeader / DrawerTitle / DrawerDescription / DrawerBody / DrawerFooter.
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Dialog } from "radix-ui";
import type { ComponentProps, HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { XIcon } from "../../lib/icons.tsx";
import { hairline, overlayBackdrop, sheetCloseButton } from "../../lib/overlay-styles.ts";

export const Drawer = Dialog.Root;
export const DrawerTrigger = Dialog.Trigger;
export const DrawerClose = Dialog.Close;

const contentVariants = cva("fixed z-(--pl-z-modal) flex flex-col overflow-hidden bg-elevated text-fg shadow-xl outline-none", {
  variants: {
    side: {
      // pl-drawer slides along --pl-drawer-from; flipped under RTL so the panel enters from its own edge.
      start: "pl-drawer inset-y-0 start-0 w-[calc(100%-2rem)] pt-(--pl-safe-top) pb-(--pl-safe-bottom) [--pl-drawer-from:-100%] rtl:[--pl-drawer-from:100%]",
      end: "pl-drawer inset-y-0 end-0 w-[calc(100%-2rem)] pt-(--pl-safe-top) pb-(--pl-safe-bottom) [--pl-drawer-from:100%] rtl:[--pl-drawer-from:-100%]",
      bottom: "pl-dialog-sheet inset-x-0 bottom-0 rounded-t-3xl pb-(--pl-safe-bottom)",
    },
    size: { sm: "", md: "", lg: "" },
  },
  compoundVariants: [
    { side: ["start", "end"], size: "sm", className: "max-w-sm" },
    { side: ["start", "end"], size: "md", className: "max-w-md" },
    { side: ["start", "end"], size: "lg", className: "max-w-2xl" },
    { side: "bottom", size: "sm", className: "max-h-[40dvh]" },
    { side: "bottom", size: "md", className: "max-h-[64dvh]" },
    { side: "bottom", size: "lg", className: "max-h-[92dvh]" },
  ],
  defaultVariants: { side: "end", size: "md" },
});

export type DrawerContentProps = ComponentProps<typeof Dialog.Content> &
  VariantProps<typeof contentVariants> & {
    /** × button in the top corner. */
    showClose?: boolean;
    closeLabel?: string;
  };

export function DrawerContent({ className, side, size, showClose = true, closeLabel = "Close", children, ...props }: DrawerContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className={overlayBackdrop} />
      <Dialog.Content className={cn(contentVariants({ side, size }), hairline, className)} {...props}>
        {children}
        {showClose && (
          <Dialog.Close className={cn(sheetCloseButton, "absolute end-4 top-[calc(var(--pl-safe-top)+1rem)]", side === "bottom" && "top-4")} aria-label={closeLabel}>
            <XIcon strokeWidth={3} />
          </Dialog.Close>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

type DivProps = HTMLAttributes<HTMLDivElement>;

export function DrawerHeader({ className, ...props }: DivProps) {
  return <div className={cn("flex shrink-0 flex-col gap-1 px-5 pt-5 pe-12 pb-2", className)} {...props} />;
}

export function DrawerTitle({ className, ...props }: ComponentProps<typeof Dialog.Title>) {
  return <Dialog.Title className={cn("text-title3 text-fg", className)} {...props} />;
}

export function DrawerDescription({ className, ...props }: ComponentProps<typeof Dialog.Description>) {
  return <Dialog.Description className={cn("text-subhead text-fg-muted", className)} {...props} />;
}

export function DrawerBody({ className, ...props }: DivProps) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3 text-body", className)} {...props} />;
}

export function DrawerFooter({ className, ...props }: DivProps) {
  return (
    <div
      className={cn("flex shrink-0 flex-col-reverse gap-2 border-t border-(--pl-hair) px-5 pt-3 pb-5 sm:flex-row sm:justify-end [&>*]:max-sm:w-full", className)}
      {...props}
    />
  );
}
