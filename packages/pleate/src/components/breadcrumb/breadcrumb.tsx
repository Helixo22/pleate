// Breadcrumb: where the page sits in the hierarchy. Pass `items` (data) or compose BreadcrumbList / BreadcrumbItem /
// BreadcrumbLink / BreadcrumbPage yourself. With maxItems the middle collapses into "…", which expands on press.
"use client";

import { Slot } from "radix-ui";
import { Fragment, useState, type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronRightIcon } from "../../lib/icons.tsx";

export type BreadcrumbEntry = { label: ReactNode; href?: string; icon?: ReactNode };

export type BreadcrumbProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  items?: BreadcrumbEntry[];
  /** Collapse the middle when there are more items than this (first and last ones stay). */
  maxItems?: number;
  /** Renders each linked item, e.g. (item, props) => <Link href={item.href} {...props} />. */
  renderLink?: (item: BreadcrumbEntry, props: { className: string; children: ReactNode }) => ReactNode;
  separator?: ReactNode;
  children?: ReactNode;
  label?: string;
};

export function Breadcrumb({ items, maxItems, renderLink, separator, children, label = "Breadcrumb", className, ...props }: BreadcrumbProps) {
  const [expanded, setExpanded] = useState(false);
  if (!items) {
    return (
      <nav aria-label={label} className={className} {...props}>
        {children}
      </nav>
    );
  }
  const collapse = maxItems !== undefined && !expanded && items.length > maxItems;
  const visible: (BreadcrumbEntry | "ellipsis")[] = collapse
    ? [items[0], "ellipsis", ...items.slice(items.length - Math.max(1, maxItems - 1))]
    : items;

  return (
    <nav aria-label={label} className={className} {...props}>
      <BreadcrumbList>
        {visible.map((item, i) => {
          const last = i === visible.length - 1;
          return (
            <Fragment key={i}>
              {i > 0 && <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>}
              <BreadcrumbItem>
                {item === "ellipsis" ? (
                  <button
                    type="button"
                    aria-label="Show full path"
                    onClick={() => setExpanded(true)}
                    className="pl-focus-ring cursor-pointer rounded-md px-1 text-fg-muted hover:bg-fill-2 hover:text-fg"
                  >
                    …
                  </button>
                ) : last || !item.href ? (
                  <BreadcrumbPage>
                    {item.icon}
                    {item.label}
                  </BreadcrumbPage>
                ) : renderLink ? (
                  renderLink(item, { className: linkClass, children: <>{item.icon}{item.label}</> })
                ) : (
                  <BreadcrumbLink href={item.href}>
                    {item.icon}
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </nav>
  );
}

export function BreadcrumbList({ className, ...props }: HTMLAttributes<HTMLOListElement>) {
  return <ol className={cn("flex flex-wrap items-center gap-1 text-subhead text-fg-muted", className)} {...props} />;
}

export function BreadcrumbItem({ className, ...props }: HTMLAttributes<HTMLLIElement>) {
  return <li className={cn("inline-flex min-w-0 items-center gap-1.5 [&_svg]:size-4 [&_svg]:shrink-0", className)} {...props} />;
}

const linkClass = "pl-focus-ring inline-flex max-w-48 items-center gap-1.5 truncate rounded-xs transition-colors hover:text-fg";

export function BreadcrumbLink({
  className,
  asChild,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { asChild?: boolean; ref?: Ref<HTMLAnchorElement> }) {
  const Comp = asChild ? Slot.Root : "a";
  return <Comp className={cn(linkClass, className)} {...props} />;
}

export function BreadcrumbPage({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span aria-current="page" className={cn("inline-flex max-w-64 items-center gap-1.5 truncate font-medium text-fg", className)} {...props} />
  );
}

export function BreadcrumbSeparator({ children, className, ...props }: HTMLAttributes<HTMLLIElement>) {
  return (
    <li role="presentation" aria-hidden="true" className={cn("text-fg-subtle [&_svg]:size-3.5", className)} {...props}>
      {children ?? <ChevronRightIcon className="rtl:rotate-180" strokeWidth={2.5} />}
    </li>
  );
}
