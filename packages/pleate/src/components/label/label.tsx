// Label: the form label, with an optional required mark (announced as "required") and a trailing hint.
"use client";

import { Label as LabelPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export type LabelProps = ComponentProps<typeof LabelPrimitive.Root> & {
  required?: boolean;
  hint?: ReactNode;
};

export function Label({ className, required, hint, children, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "flex items-baseline gap-1 text-subhead font-medium text-fg select-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-danger-ink" aria-hidden="true">
          *
        </span>
      )}
      {required && <span className="sr-only">(required)</span>}
      {hint && <span className="ms-auto text-footnote font-normal text-fg-muted">{hint}</span>}
    </LabelPrimitive.Root>
  );
}
