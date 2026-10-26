// OAuthButtons: "Continue with Google / GitHub / Apple" buttons. Built-in monochrome marks (they follow the text
// color, so they work in both themes) for google, github and apple, a key for anything else, or your own icon.
// Each button is a link when the provider has an href, otherwise it calls onSelect(id). `loadingId` shows a spinner
// on the provider being redirected to and disables the others.
"use client";

import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { KeyIcon } from "../../lib/icons.tsx";
import { Button } from "../../components/button/button.tsx";

export type OAuthProvider = {
  /** "google", "github", "apple" get a built-in mark; any other id gets a key. */
  id: string;
  name: string;
  href?: string;
  icon?: ReactNode;
};

export type OAuthButtonsProps = {
  providers: OAuthProvider[];
  onSelect?: (id: string) => void;
  /** Provider currently redirecting (spinner, others disabled). */
  loadingId?: string | null;
  disabled?: boolean;
  /** "stack": full-width rows; "row": side by side, icons only on small widths when there are three or more. */
  layout?: "stack" | "row";
  size?: "md" | "lg";
  labels?: { continueWith?: (name: string) => string };
  className?: string;
};

const MARK_PROPS = { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, focusable: false } as const;

export function ProviderMark({ id }: { id: string }) {
  switch (id) {
    case "google":
      return (
        <svg {...MARK_PROPS}>
          <path d="M12.24 10.29v3.72h5.25c-.22 1.28-1.6 3.74-5.25 3.74-3.16 0-5.73-2.62-5.73-5.85s2.57-5.85 5.73-5.85c1.8 0 3 .77 3.69 1.43l2.52-2.43C16.83 3.55 14.75 2.6 12.24 2.6 7.1 2.6 2.94 6.76 2.94 11.9s4.16 9.3 9.3 9.3c5.37 0 8.93-3.77 8.93-9.09 0-.61-.07-1.08-.15-1.54l-8.78-.28Z" />
        </svg>
      );
    case "github":
      return (
        <svg {...MARK_PROPS}>
          <path d="M12 2.25a9.75 9.75 0 0 0-3.08 19c.49.09.67-.21.67-.47v-1.66c-2.71.59-3.28-1.31-3.28-1.31-.44-1.13-1.08-1.43-1.08-1.43-.89-.6.07-.59.07-.59.98.07 1.5 1.01 1.5 1.01.87 1.49 2.28 1.06 2.84.81.09-.63.34-1.06.62-1.3-2.17-.25-4.44-1.08-4.44-4.82 0-1.06.38-1.93 1-2.61-.1-.25-.43-1.24.1-2.58 0 0 .82-.26 2.68 1a9.3 9.3 0 0 1 4.88 0c1.86-1.26 2.68-1 2.68-1 .53 1.34.2 2.33.1 2.58.62.68 1 1.55 1 2.61 0 3.75-2.28 4.57-4.45 4.81.35.3.66.89.66 1.8v2.67c0 .26.18.57.67.47A9.75 9.75 0 0 0 12 2.25Z" />
        </svg>
      );
    case "apple":
      return (
        <svg {...MARK_PROPS}>
          <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31a4.05 4.05 0 0 0-3.18-1.72c-1.35-.14-2.65.8-3.33.8-.7 0-1.75-.78-2.88-.76a4.26 4.26 0 0 0-3.6 2.19c-1.54 2.67-.39 6.62 1.1 8.79.74 1.06 1.61 2.25 2.75 2.2 1.11-.04 1.53-.71 2.87-.71 1.33 0 1.71.71 2.88.69 1.19-.02 1.94-1.07 2.66-2.14a9.47 9.47 0 0 0 1.21-2.48 3.84 3.84 0 0 1-2.36-3.55ZM14.17 6.14A3.84 3.84 0 0 0 15.08 3.36a3.9 3.9 0 0 0-2.53 1.31 3.66 3.66 0 0 0-.93 2.68 3.23 3.23 0 0 0 2.55-1.21Z" />
        </svg>
      );
    default:
      return <KeyIcon strokeWidth={2} />;
  }
}

export function OAuthButtons({
  providers,
  onSelect,
  loadingId,
  disabled,
  layout = "stack",
  size = "md",
  labels,
  className,
}: OAuthButtonsProps) {
  const continueWith = labels?.continueWith ?? ((name: string) => `Continue with ${name}`);
  const compact = layout === "row" && providers.length >= 3;
  return (
    <div
      className={cn(layout === "stack" ? "flex flex-col gap-2.5" : "grid gap-2.5", className)}
      style={layout === "row" ? { gridTemplateColumns: `repeat(${providers.length}, minmax(0, 1fr))` } : undefined}
    >
      {providers.map((provider) => {
        const label = continueWith(provider.name);
        const busy = loadingId === provider.id;
        const off = disabled || (Boolean(loadingId) && !busy);
        const content = (
          <>
            <span className="grid size-5 shrink-0 place-items-center [&_svg]:size-5">{provider.icon ?? <ProviderMark id={provider.id} />}</span>
            <span className={cn("truncate", compact && "max-sm:sr-only")}>{layout === "row" ? provider.name : label}</span>
          </>
        );
        const common = {
          variant: "outline" as const,
          tone: "neutral" as const,
          size,
          fullWidth: true,
          className: "min-w-0 font-semibold",
          "aria-label": layout === "row" ? label : undefined,
        };
        if (provider.href && !off && !busy) {
          return (
            <Button key={provider.id} asChild {...common}>
              <a href={provider.href} onClick={() => onSelect?.(provider.id)}>
                {content}
              </a>
            </Button>
          );
        }
        return (
          <Button key={provider.id} {...common} loading={busy} disabled={off} onClick={() => onSelect?.(provider.id)}>
            {content}
          </Button>
        );
      })}
    </div>
  );
}
