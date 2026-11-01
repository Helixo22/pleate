// AlertDialog: the iOS alert. A narrow centered card with a centered title and message, and its buttons as full-width
// text rows under a hairline: two side by side, three or more stacked (`buttons` overrides). For decisions that need
// an answer (Radix AlertDialog: it can't be closed by clicking outside, focus starts on the cancel action). Pass
// `actions` for the common case, `children` for a text field.
"use client";

import { AlertDialog as Primitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { hairline } from "../../lib/overlay-styles.ts";

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
  /** "auto" (default) puts two buttons side by side and stacks three or more. */
  buttons?: "auto" | "row" | "stack";
  /** Extra content between the message and the buttons (a text field…). */
  children?: ReactNode;
};

const button =
  "pl-focus-ring pl-touch flex min-h-11 w-full cursor-pointer items-center justify-center px-3 py-2.5 text-center text-body text-accent-ink " +
  "outline-offset-[-2px] transition-colors hover:bg-fill-3 active:bg-fill-2";

export function AlertDialog({ open, defaultOpen, onOpenChange, trigger, title, description, actions, buttons = "auto", children }: AlertDialogProps) {
  const list = actions ?? [{ label: "OK", role: "cancel" as const }];
  const row = buttons === "row" || (buttons === "auto" && list.length === 2);
  return (
    <Primitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>}
      <Primitive.Portal>
        <Primitive.Overlay className="pl-fade fixed inset-0 z-(--pl-z-modal) bg-overlay" />
        <Primitive.Content
          className={cn(
            "pl-alert fixed start-1/2 top-1/2 z-(--pl-z-modal) w-[min(18rem,calc(100%-3rem))] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2",
            "overflow-hidden rounded-lg bg-elevated text-fg shadow-xl outline-none",
            hairline,
          )}
        >
          <div className="flex flex-col gap-1 px-4 pt-5 pb-4 text-center">
            <Primitive.Title className="text-headline text-fg">{title}</Primitive.Title>
            {description ? (
              <Primitive.Description className="text-footnote text-fg">{description}</Primitive.Description>
            ) : (
              <Primitive.Description className="sr-only">{typeof title === "string" ? title : "Alert"}</Primitive.Description>
            )}
            {children && <div className="mt-3 text-start">{children}</div>}
          </div>
          <div
            className={cn(
              "border-t border-(--pl-hair)",
              row ? "grid grid-cols-2 divide-x divide-(--pl-hair) rtl:divide-x-reverse" : "flex flex-col divide-y divide-(--pl-hair)",
            )}
          >
            {list.map((action, i) => {
              const Comp = action.role === "cancel" ? Primitive.Cancel : Primitive.Action;
              return (
                <Comp
                  key={i}
                  onClick={action.onSelect}
                  className={cn(button, action.role === "cancel" && "font-semibold", action.role === "destructive" && "text-danger-ink")}
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
