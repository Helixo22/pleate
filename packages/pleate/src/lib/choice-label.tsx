// Wraps a checkbox, radio or switch with its label and an optional description, wiring ids for screen readers.
// The whole row is clickable (it is a <label>), which gives touch users a large target.
import type { ReactNode } from "react";
import { cn } from "./cn.ts";

export type ChoiceLabelProps = {
  id: string;
  label?: ReactNode;
  description?: ReactNode;
  /** "end": control then text (forms). "start": text then control, spread across the row (iOS settings). */
  placement?: "start" | "end";
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export function ChoiceLabel({ id, label, description, placement = "end", disabled, className, children }: ChoiceLabelProps) {
  if (!label && !description) return <>{children}</>;
  const text = (
    <span className="flex min-w-0 flex-col gap-0.5">
      {label && <span className="text-body text-fg">{label}</span>}
      {description && (
        <span id={`${id}-description`} className="text-footnote text-fg-muted">
          {description}
        </span>
      )}
    </span>
  );
  return (
    <label
      htmlFor={id}
      className={cn(
        "pl-touch flex cursor-pointer gap-3",
        description ? "items-start" : "items-center",
        placement === "start" && "justify-between",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {placement === "start" ? (
        <>
          {text}
          {children}
        </>
      ) : (
        <>
          {children}
          {text}
        </>
      )}
    </label>
  );
}
