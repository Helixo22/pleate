// AlertDialog: a small confirmation dialog. An optional icon in a soft round tile (red when an action is destructive)
// beside a left-aligned title and message, a round close button in the corner, then the buttons at the bottom right:
// cancel first in gray, the main action filled (red when destructive). On phones the buttons stack full width
// with cancel at the bottom. For decisions that need an answer (Radix AlertDialog: it can't be closed by clicking
// outside, focus starts on the cancel action). Pass `actions` for the common case, `children` for a text field.
"use client";

import { AlertDialog as Primitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { XIcon } from "../../lib/icons.tsx";
import { overlayBackdrop, overlaySurface, sheetCloseButton } from "../../lib/overlay-styles.ts";
import { Button } from "../button/button.tsx";

export const AlertDialogRoot = Primitive.Root;
export const AlertDialogTrigger = Primitive.Trigger;

export type AlertDialogAction = {
  label: ReactNode;
  onSelect?: () => void;
  /** "cancel" is the quiet button and receives focus; "destructive" is red. */
  role?: "default" | "cancel" | "destructive";
};

export type AlertDialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the alert. */
  trigger?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Shown in a round tile beside the title (a trash can, a warning sign…). */
  icon?: ReactNode;
  /** × in the top corner; it cancels like Escape. */
  showClose?: boolean;
  closeLabel?: string;
  actions?: AlertDialogAction[];
  /** "auto" (default): a row at the bottom right, stacked full width on phones. "row" never stacks, "stack" always does. */
  buttons?: "auto" | "row" | "stack";
  /** Extra content between the message and the buttons (a text field…). */
  children?: ReactNode;
};

const layouts = {
  auto: "flex-col-reverse sm:flex-row sm:justify-end [&>*]:max-sm:w-full",
  row: "flex-row flex-wrap justify-end",
  stack: "flex-col [&>*]:w-full",
};

export function AlertDialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  icon,
  showClose = true,
  closeLabel = "Close",
  actions,
  buttons = "auto",
  children,
}: AlertDialogProps) {
  const list = actions ?? [{ label: "OK", role: "cancel" as const }];
  const danger = list.some((a) => a.role === "destructive");
  // In a row the cancel action sits first (leftmost); a stack keeps the given order.
  const ordered = buttons === "stack" ? list : [...list.filter((a) => a.role === "cancel"), ...list.filter((a) => a.role !== "cancel")];
  return (
    <Primitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>}
      <Primitive.Portal>
        <Primitive.Overlay className={overlayBackdrop} />
        <Primitive.Content
          className={cn(
            "pl-dialog fixed start-1/2 top-1/2 z-(--pl-z-modal) w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2",
            "rounded-2xl p-5 outline-none",
            overlaySurface,
          )}
        >
          {/* Before the actions in the DOM: Radix focuses the last Cancel it registers, which must be the cancel button. */}
          {showClose && (
            <Primitive.Cancel className={cn(sheetCloseButton, "absolute end-4 top-4")} aria-label={closeLabel}>
              <XIcon strokeWidth={2.5} />
            </Primitive.Cancel>
          )}
          <div className={cn("flex items-start gap-4", showClose && "pe-8")}>
            {icon && (
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-12 shrink-0 place-items-center rounded-full [&_svg]:size-5",
                  danger ? "bg-danger-soft text-danger-ink" : "bg-accent-soft text-accent-ink",
                )}
              >
                {icon}
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <Primitive.Title className="text-headline text-fg">{title}</Primitive.Title>
              {description ? (
                <Primitive.Description className="text-subhead text-fg-muted">{description}</Primitive.Description>
              ) : (
                <Primitive.Description className="sr-only">{typeof title === "string" ? title : "Alert"}</Primitive.Description>
              )}
            </div>
          </div>
          {children && <div className="mt-4">{children}</div>}
          <div className={cn("mt-6 flex gap-2", layouts[buttons])}>
            {ordered.map((action, i) => {
              const cancel = action.role === "cancel";
              const Comp = cancel ? Primitive.Cancel : Primitive.Action;
              return (
                <Comp key={i} asChild onClick={action.onSelect}>
                  <Button
                    size="md"
                    variant={cancel ? "gray" : "filled"}
                    tone={action.role === "destructive" ? "danger" : "accent"}
                  >
                    {action.label}
                  </Button>
                </Comp>
              );
            })}
          </div>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
