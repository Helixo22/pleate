// Footer: the site footer in the apple.com manner — small, quiet type; link columns that become tap-to-open rows on
// phones; a bottom bar for the legal line. Compose Footer, FooterColumns, FooterColumn, FooterLink and FooterBottom.
"use client";

import { Slot } from "radix-ui";
import { useId, useState, type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronDownIcon } from "../../lib/icons.tsx";
import { Container, type ContainerProps } from "../container/container.tsx";

export type FooterProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  size?: ContainerProps["size"];
  /** Brand block shown above the columns (logo, one-line pitch, social links). */
  brand?: ReactNode;
};

export function Footer({ className, size = "xl", brand, children, ...props }: FooterProps) {
  return (
    <footer
      className={cn("bg-bg pt-12 pb-[calc(2rem+var(--pl-safe-bottom))] text-footnote text-fg-muted md:pt-16", className)}
      {...props}
    >
      <Container size={size} className="flex flex-col gap-10">
        {brand && <div className="flex max-w-sm flex-col gap-3">{brand}</div>}
        {children}
      </Container>
    </footer>
  );
}

export function FooterColumns({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-x-8 md:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] md:gap-y-10", className)} {...props} />;
}

export function FooterColumn({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  // Phones get a disclosure button; from md the title is plain text and the list always shows (pure CSS, so the
  // server render is already right on desktop).
  return (
    <div className={cn("border-b border-separator md:border-0", className)}>
      <h3 className="text-footnote font-semibold text-fg">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="pl-focus-ring pl-touch flex min-h-12 w-full cursor-pointer items-center justify-between text-start md:hidden"
        >
          {title}
          <ChevronDownIcon
            className={cn("size-4 text-fg-muted transition-[rotate] duration-(--pl-duration-base) ease-ios", open && "rotate-180")}
          />
        </button>
        <span className="hidden pb-3 md:block">{title}</span>
      </h3>
      <ul id={id} className={cn("flex-col gap-2.5 pb-4 md:flex md:pb-0", open ? "flex" : "hidden")}>
        {children}
      </ul>
    </div>
  );
}

export type FooterLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { ref?: Ref<HTMLAnchorElement>; asChild?: boolean };

export function FooterLink({ className, asChild, ...props }: FooterLinkProps) {
  const Comp = asChild ? Slot.Root : "a";
  return (
    <li>
      <Comp className={cn("pl-focus-ring rounded-xs text-fg-muted transition-colors hover:text-fg hover:underline", className)} {...props} />
    </li>
  );
}

export function FooterBottom({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-3 border-t border-separator pt-5 md:flex-row md:items-center md:justify-between", className)}
      {...props}
    />
  );
}
