// ModelPicker: choose the AI model. A quiet pill trigger showing the current model; the menu lists models with an
// icon, a one-line description, badges (Fast, Reasoning, New…) and a checkmark, optionally in groups.
// Keyboard and screen readers get a radio menu (Radix DropdownMenu).
"use client";

import { DropdownMenu } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { CheckIcon, ChevronDownIcon } from "../../lib/icons.tsx";

export type ModelOption = {
  id: string;
  name: string;
  description?: ReactNode;
  icon?: ReactNode;
  badges?: ReactNode;
  group?: string;
  disabled?: boolean;
};

export type ModelPickerProps = {
  models: ModelOption[];
  value: string;
  onValueChange: (id: string) => void;
  label?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  /** "ghost" sits in a toolbar; "field" looks like a form field. */
  variant?: "ghost" | "field";
  className?: string;
};

export function ModelPicker({ models, value, onValueChange, label = "Model", align = "start", side, variant = "ghost", className }: ModelPickerProps) {
  const current = models.find((m) => m.id === value);
  const groups = [...new Set(models.map((m) => m.group ?? ""))];
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`${label}: ${current?.name ?? ""}`}
        className={cn(
          "pl-focus-ring pl-touch inline-flex min-w-0 cursor-pointer items-center gap-1.5 text-subhead font-semibold text-fg transition-colors [&_svg]:size-4",
          variant === "ghost" ? "h-9 rounded-full px-3 hover:bg-fill-2 data-[state=open]:bg-fill-2" : "h-11 rounded-lg bg-fill-2 px-3.5 hover:bg-fill",
          className,
        )}
      >
        {current?.icon && <span className="flex shrink-0 text-accent-ink">{current.icon}</span>}
        <span className="truncate">{current?.name ?? label}</span>
        <ChevronDownIcon className="shrink-0 text-fg-muted" strokeWidth={2.5} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          side={side}
          sideOffset={8}
          collisionPadding={8}
          className="pl-pop z-(--pl-z-dropdown) w-[min(20rem,calc(100vw-1rem))] max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto rounded-2xl bg-elevated p-1.5 text-fg shadow-xl outline-none"
        >
          <DropdownMenu.RadioGroup value={value} onValueChange={onValueChange}>
            {groups.map((group, gi) => (
              <DropdownMenu.Group key={group || gi}>
                {gi > 0 && <DropdownMenu.Separator className="-mx-1.5 my-1.5 h-px bg-separator" />}
                {group && <DropdownMenu.Label className="px-3 pt-2 pb-1 text-footnote font-semibold text-fg-muted">{group}</DropdownMenu.Label>}
                {models
                  .filter((m) => (m.group ?? "") === group)
                  .map((m) => (
                    <DropdownMenu.RadioItem
                      key={m.id}
                      value={m.id}
                      disabled={m.disabled}
                      className="pl-touch relative flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors data-disabled:pointer-events-none data-disabled:opacity-40 data-highlighted:bg-fill-2"
                    >
                      {m.icon && <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink [&_svg]:size-4">{m.icon}</span>}
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex flex-wrap items-center gap-1.5 text-subhead font-semibold">
                          {m.name}
                          {m.badges}
                        </span>
                        {m.description && <span className="text-footnote text-fg-muted">{m.description}</span>}
                      </span>
                      <DropdownMenu.ItemIndicator className="mt-1 shrink-0 text-accent-ink">
                        <CheckIcon className="size-4" strokeWidth={2.75} />
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                  ))}
              </DropdownMenu.Group>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
