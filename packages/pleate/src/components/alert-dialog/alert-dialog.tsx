// AlertDialog: a small centered dialog with a title, a message and its buttons on a footer strip, in a row from
// the trailing edge (stacked on phones), for decisions that need an answer (Radix AlertDialog: it can't be closed
// by clicking outside, focus starts on the safest action). Pass `actions` for the common case or compose freely.
"use client";

import { AlertDialog as Primitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { buttonVariants } from "../button/button.tsx";

export const AlertDialogRoot = Primitive.Root;
export const AlertDialogTrigger = Primitive.Trigger;

export type AlertDialogAction = {
  label: ReactNode;
  onSelect?: () => void;
  /** "cancel" is bold and receives focus; "destructive" is red. */
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
  actions?: AlertDialogAction[];
  /** Extra content between the message and the buttons (a text field…). */
  children?: ReactNode;
};

const actionLook = {
  default: { variant: "filled", tone: "accent" },
  cancel: { variant: "surface", tone: "neutral" },
  destructive: { variant: "filled", tone: "danger" },
} as const;

export function AlertDialog({ open, defaultOpen, onOpenChange, trigger, title, description, actions, children }: AlertDialogProps) {
  const list = actions ?? [{ label: "OK", role: "cancel" as const }];
  return (
    <Primitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>}
      <Primitive.Portal>
        <Primitive.Overlay className="pl-fade fixed inset-0 z-(--pl-z-modal) bg-overlay" />
        <Primitive.Content
          className={cn(
            "pl-alert fixed start-1/2 top-1/2 z-(--pl-z-modal) w-[min(25rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2",
            "overflow-hidden rounded-xl bg-elevated text-fg shadow-xl outline-none",
          )}
        >
          <div className="flex flex-col gap-1.5 px-5 pt-5 pb-5">
            <Primitive.Title className="text-title3 text-fg">{title}</Primitive.Title>
            {description ? (
              <Primitive.Description className="text-subhead text-fg-muted">{description}</Primitive.Description>
            ) : (
              <Primitive.Description className="sr-only">{typeof title === "string" ? title : "Alert"}</Primitive.Description>
            )}
            {children && <div className="mt-3">{children}</div>}
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-separator bg-surface-2 px-5 py-3.5 sm:flex-row sm:justify-end">
            {list.map((action, i) => {
              const Comp = action.role === "cancel" ? Primitive.Cancel : Primitive.Action;
              return (
                <Comp
                  key={i}
                  onClick={action.onSelect}
                  className={buttonVariants({ ...actionLook[action.role ?? "default"], size: "md", fullWidth: true, className: "sm:w-auto" })}
                >
                  {action.label}
                </Comp>
              );
            })}
          </div>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}

