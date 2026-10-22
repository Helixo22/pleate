// AlertDialog: the iOS alert. A small centered card with a title, a message and up to a few buttons, side by side
// when there are two, stacked otherwise, for decisions that need an answer (Radix AlertDialog: it can't be closed
// by clicking outside, focus starts on the safest action). Pass `actions` for the common case or compose freely.
"use client";

import { AlertDialog as Primitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

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

const buttonBase =
  "pl-focus-ring pl-touch min-h-11 flex-1 cursor-pointer px-4 py-2.5 text-body text-accent-ink outline-offset-[-2px] " +
  "transition-colors hover:bg-fill-3 active:bg-fill-2";

export function AlertDialog({ open, defaultOpen, onOpenChange, trigger, title, description, actions, children }: AlertDialogProps) {
  const list = actions ?? [{ label: "OK", role: "cancel" as const }];
  const row = list.length === 2;
  return (
    <Primitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>}
      <Primitive.Portal>
        <Primitive.Overlay className="pl-fade fixed inset-0 z-(--pl-z-modal) bg-overlay" />
        <Primitive.Content
          className={cn(
            "pl-alert fixed start-1/2 top-1/2 z-(--pl-z-modal) w-[min(17.5rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2",
            "overflow-hidden rounded-2xl bg-elevated text-center text-fg shadow-xl outline-none",
          )}
        >
          <div className="flex flex-col gap-1 px-4 pt-5 pb-4">
            <Primitive.Title className="text-headline">{title}</Primitive.Title>
            {description ? (
              <Primitive.Description className="text-footnote text-fg">{description}</Primitive.Description>
            ) : (
              <Primitive.Description className="sr-only">{typeof title === "string" ? title : "Alert"}</Primitive.Description>
            )}
            {children && <div className="mt-3 text-start">{children}</div>}
          </div>
          <div className={cn("flex border-t border-separator", row ? "flex-row divide-x divide-separator rtl:divide-x-reverse" : "flex-col divide-y divide-separator")}>
            {list.map((action, i) => {
              const Comp = action.role === "cancel" ? Primitive.Cancel : Primitive.Action;
              return (
                <Comp
                  key={i}
                  onClick={action.onSelect}
                  className={cn(
                    buttonBase,
                    action.role === "cancel" && "font-semibold",
                    action.role === "destructive" && "text-danger-ink",
                  )}
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

