// NavigationBar: the iOS app bar. A 44pt row (leading · title · trailing) that sticks to the top; with largeTitle the
// title first sits big under the bar and, as it scrolls under it, the small centered title fades in together with
// the hairline. NavigationBarBack is the "‹ Back" button (asChild for links).
"use client";

import { Slot } from "radix-ui";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode, type Ref, type RefObject } from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronRightIcon } from "../../lib/icons.tsx";
import { useScrolled } from "../../lib/use-scroll.ts";

export type NavigationBarProps = {
  title?: ReactNode;
  /** Show the title big under the bar, collapsing into the bar on scroll (iOS large title). */
  largeTitle?: boolean;
  /** Small line under the large title. */
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Content under the large title that scrolls with it (a search field, segmented control…). */
  accessory?: ReactNode;
  /** "bg" matches grouped gray pages, "surface" white/elevated screens. */
  background?: "bg" | "surface";
  /** Heading level of the title. */
  titleAs?: "h1" | "h2";
  /** The element that scrolls, when it is not the window (split views, sheets, phone frames). */
  scrollContainer?: RefObject<HTMLElement | null>;
  className?: string;
};

export function NavigationBar({
  title,
  largeTitle = false,
  subtitle,
  leading,
  trailing,
  accessory,
  background = "bg",
  titleAs: Title = "h1",
  scrollContainer,
  className,
}: NavigationBarProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(!largeTitle);
  const scrolled = useScrolled(1, !largeTitle, scrollContainer);

  useEffect(() => {
    if (!largeTitle || !sentinel.current) return;
    const root = scrollContainer?.current ?? null;
    const safeTop = root ? 0 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pl-safe-top")) || 0;
    const observer = new IntersectionObserver(([entry]) => setCollapsed(!entry.isIntersecting), {
      root,
      rootMargin: `-${44 + safeTop}px 0px 0px 0px`,
    });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [largeTitle, scrollContainer]);

  const bg = background === "bg" ? "bg-bg" : "bg-surface";
  const showSmallTitle = !largeTitle || collapsed;
  const hairline = largeTitle ? collapsed : scrolled;

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-(--pl-z-sticky) pt-(--pl-safe-top) text-fg",
          bg,
          "shadow-[inset_0_-1px_0_transparent] transition-shadow duration-(--pl-duration-base)",
          hairline && "shadow-[inset_0_-1px_0_var(--pl-separator)]",
          className,
        )}
      >
        <div className="grid h-11 grid-cols-[1fr_auto_1fr] items-center gap-2 ps-[max(0.5rem,var(--pl-safe-left))] pe-[max(0.5rem,var(--pl-safe-right))]">
          <div className="flex min-w-0 items-center justify-start gap-1">{leading}</div>
          <div
            className={cn(
              "max-w-[50vw] truncate text-center text-headline transition-[opacity,translate] duration-(--pl-duration-base) ease-ios",
              showSmallTitle ? "opacity-100" : "translate-y-1 opacity-0",
            )}
            aria-hidden={largeTitle ? true : undefined}
          >
            {largeTitle ? title : <Title className="truncate text-headline">{title}</Title>}
          </div>
          <div className="flex min-w-0 items-center justify-end gap-1">{trailing}</div>
        </div>
      </div>
      {largeTitle && (
        <div className={cn("px-[max(1rem,var(--pl-safe-left))] pt-1 pb-3", bg)}>
          <Title className="text-large-title text-fg">{title}</Title>
          {subtitle && <p className="mt-0.5 text-subhead text-fg-muted">{subtitle}</p>}
          <div ref={sentinel} aria-hidden="true" className="h-px" />
          {accessory && <div className="mt-2">{accessory}</div>}
        </div>
      )}
    </>
  );
}

export type NavigationBarBackProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: Ref<HTMLButtonElement>;
  asChild?: boolean;
  /** Visible label next to the chevron (the previous screen's title). */
  label?: ReactNode;
};

export function NavigationBarBack({ className, asChild, label = "Back", children, ...props }: NavigationBarBackProps) {
  const Comp = asChild ? Slot.Root : "button";
  const chevron = <ChevronRightIcon className="size-[1.375rem] shrink-0 rotate-180 rtl:rotate-0" strokeWidth={2.5} />;
  return (
    <Comp
      {...(!asChild && { type: "button" as const })}
      className={cn(
        "pl-focus-ring pl-touch -ms-1 inline-flex h-11 min-w-0 cursor-pointer items-center gap-0.5 rounded-md pe-2 text-body text-accent-ink",
        "transition-opacity duration-(--pl-duration-fast) hover:opacity-80 active:opacity-50",
        className,
      )}
      {...props}
    >
      {chevron}
      {/* With asChild the child (e.g. <Link>) becomes the button and its text is the label. */}
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : <span className="truncate">{label}</span>}
    </Comp>
  );
}
