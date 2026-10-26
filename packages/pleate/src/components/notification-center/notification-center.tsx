// NotificationCenter: an inbox of notifications grouped into Today and Earlier. Each row has an icon, a title, an
// optional body, how long ago it happened and an unread dot; it can link somewhere (marking itself read) and has
// "mark as read" and optional delete buttons. A header with "Mark all as read", skeleton rows while loading, an
// empty state, and "Load more" at the end. NotificationBell is the bell button with the unread count that opens it
// in a Popover. Data comes in through props and changes go out through callbacks: wire it to any backend.
"use client";

import { Popover as Primitive } from "radix-ui";
import { useMemo, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { BellIcon, CheckIcon, TrashIcon } from "../../lib/icons.tsx";
import { formatTimeAgo, isSameDay, toDate, type DateInput } from "../../lib/time.ts";
import { Button } from "../button/button.tsx";
import { EmptyState } from "../empty-state/empty-state.tsx";
import { IconButton, type IconButtonProps } from "../icon-button/icon-button.tsx";
import { Skeleton } from "../skeleton/skeleton.tsx";

export type NotificationItem = {
  id: string;
  title: ReactNode;
  body?: ReactNode;
  createdAt: DateInput;
  read: boolean;
  href?: string;
  /** Free form category ("comment", "billing"…), used to pick an icon from `icons`. */
  kind?: string;
  /** Icon for this item; overrides `icons[kind]`. */
  icon?: ReactNode;
};

export type NotificationCenterLabels = {
  title?: string;
  markAllRead?: string;
  markRead?: string;
  delete?: string;
  today?: string;
  earlier?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  loadMore?: string;
  loading?: string;
  unread?: string;
};

const L = {
  title: "Notifications",
  markAllRead: "Mark all as read",
  markRead: "Mark as read",
  delete: "Delete",
  today: "Today",
  earlier: "Earlier",
  emptyTitle: "You're all caught up",
  emptyDescription: "New notifications will show up here.",
  loadMore: "Load more",
  loading: "Loading notifications",
  unread: "Unread",
};

export type NotificationCenterProps = {
  items: NotificationItem[];
  /** Defaults to the number of unread items. */
  unreadCount?: number;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDelete?: (id: string) => void;
  /** Called when a row is opened (before following its href). */
  onSelect?: (item: NotificationItem) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  /** Skeleton rows when there are no items yet, a busy "Load more" otherwise. */
  loading?: boolean;
  /** Icons per item kind. */
  icons?: Record<string, ReactNode>;
  /** Reference time for "5 minutes ago" and the Today group. */
  now?: Date;
  locale?: string;
  /** Hide the title row (when the container already has one). */
  hideHeader?: boolean;
  /** Max height of the scrolling list (CSS length). */
  maxHeight?: string;
  labels?: NotificationCenterLabels;
  className?: string;
};

function Row({
  item,
  icon,
  time,
  l,
  onMarkRead,
  onDelete,
  onSelect,
}: {
  item: NotificationItem;
  icon: ReactNode;
  time: string;
  l: typeof L;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSelect?: (item: NotificationItem) => void;
}) {
  const open = () => {
    onSelect?.(item);
    if (!item.read) onMarkRead?.(item.id);
  };
  const content = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink [&_svg]:size-[1.125rem]" aria-hidden="true">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("text-subhead text-fg", !item.read && "font-semibold")}>
          {!item.read && <span className="sr-only">{l.unread}: </span>}
          {item.title}
        </span>
        {item.body && <span className="line-clamp-2 text-footnote text-fg-muted">{item.body}</span>}
        <time dateTime={toDate(item.createdAt).toISOString()} suppressHydrationWarning className="text-caption1 text-fg-subtle">
          {time}
        </time>
      </span>
    </>
  );
  const interactive = Boolean(item.href || onSelect);
  const rowClass = cn(
    "flex min-w-0 flex-1 items-start gap-3 rounded-xl px-2 py-2.5 text-start",
    interactive && "pl-focus-ring cursor-pointer outline-offset-[-2px]",
  );
  return (
    <li className={cn("group/n relative flex items-start gap-1 rounded-xl transition-colors duration-(--pl-duration-instant)", interactive && "hover:bg-fill-3")}>
      {item.href ? (
        <a href={item.href} onClick={open} className={rowClass}>
          {content}
        </a>
      ) : onSelect ? (
        <button type="button" onClick={open} className={rowClass}>
          {content}
        </button>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
      <div className="flex shrink-0 items-center gap-0.5 self-center pe-1">
        {!item.read && onMarkRead && (
          <IconButton
            aria-label={`${l.markRead}: ${typeof item.title === "string" ? item.title : ""}`.replace(/: $/, "")}
            variant="plain"
            tone="neutral"
            size="xs"
            className="text-fg-muted opacity-100 md:opacity-0 md:group-hover/n:opacity-100 md:focus-visible:opacity-100"
            onClick={() => onMarkRead(item.id)}
          >
            <CheckIcon />
          </IconButton>
        )}
        {onDelete && (
          <IconButton
            aria-label={`${l.delete}: ${typeof item.title === "string" ? item.title : ""}`.replace(/: $/, "")}
            variant="plain"
            tone="neutral"
            size="xs"
            className="text-fg-muted opacity-100 hover:text-danger-ink md:opacity-0 md:group-hover/n:opacity-100 md:focus-visible:opacity-100"
            onClick={() => onDelete(item.id)}
          >
            <TrashIcon />
          </IconButton>
        )}
        <span aria-hidden="true" className={cn("ms-1 size-2.5 rounded-full", item.read ? "bg-transparent" : "bg-accent")} />
      </div>
    </li>
  );
}

export function NotificationCenter({
  items,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onSelect,
  onLoadMore,
  hasMore,
  loading,
  icons,
  now,
  locale,
  hideHeader,
  maxHeight,
  labels,
  className,
}: NotificationCenterProps) {
  const l = { ...L, ...labels };
  const unread = unreadCount ?? items.filter((i) => !i.read).length;
  const groups = useMemo(() => {
    const ref = now ?? new Date();
    const today: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];
    for (const item of items) (isSameDay(toDate(item.createdAt), ref) ? today : earlier).push(item);
    return [
      { key: "today", title: l.today, items: today },
      { key: "earlier", title: l.earlier, items: earlier },
    ].filter((g) => g.items.length);
  }, [items, now, l.today, l.earlier]);
  const initialLoading = loading && items.length === 0;

  return (
    <div className={cn("flex w-full min-w-0 flex-col text-fg", className)}>
      {!hideHeader && (
        <div className="flex items-center justify-between gap-3 border-b border-separator px-4 py-3">
          <h2 className="flex items-center gap-2 text-headline">
            {l.title}
            {unread > 0 && <span className="rounded-full bg-accent px-1.5 text-caption1 font-semibold text-on-accent pl-tabular">{unread}</span>}
          </h2>
          {onMarkAllRead && (
            <Button variant="plain" size="xs" onClick={onMarkAllRead} disabled={unread === 0} className="-me-1.5">
              {l.markAllRead}
            </Button>
          )}
        </div>
      )}
      <div className="min-h-0 overflow-y-auto overscroll-contain" style={{ maxHeight }} aria-busy={loading || undefined}>
        {initialLoading ? (
          <div className="flex flex-col gap-1 p-2">
            <span className="sr-only">{l.loading}</span>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-start gap-3 px-2 py-2.5">
                <Skeleton shape="circle" className="size-9" />
                <div className="flex flex-1 flex-col gap-2 pt-1">
                  <Skeleton shape="text" width="70%" className="text-subhead" />
                  <Skeleton shape="text" width="90%" className="text-footnote" />
                  <Skeleton shape="text" width="25%" className="text-caption1" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState size="sm" icon={<BellIcon />} title={l.emptyTitle} description={l.emptyDescription} />
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {groups.map((group) => (
              <section key={group.key} aria-label={group.title}>
                <h3 className="px-2 pt-2 pb-1 text-footnote font-semibold text-fg-muted">{group.title}</h3>
                <ul className="flex flex-col">
                  {group.items.map((item) => (
                    <Row
                      key={item.id}
                      item={item}
                      icon={item.icon ?? (item.kind && icons?.[item.kind]) ?? <BellIcon />}
                      time={formatTimeAgo(item.createdAt, { now, locale })}
                      l={l}
                      onMarkRead={onMarkRead}
                      onDelete={onDelete}
                      onSelect={onSelect}
                    />
                  ))}
                </ul>
              </section>
            ))}
            {hasMore && onLoadMore && (
              <div className="flex justify-center p-2">
                <Button variant="gray" size="sm" loading={loading} onClick={onLoadMore}>
                  {l.loadMore}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export type NotificationBellProps = NotificationCenterProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Look of the bell button. */
  variant?: IconButtonProps["variant"];
  size?: IconButtonProps["size"];
  align?: "start" | "center" | "end";
  /** Accessible name of the bell; the unread count is added to it. */
  bellLabel?: (unread: number) => string;
  /** Classes for the popover panel. */
  contentClassName?: string;
};

export function NotificationBell({
  open,
  defaultOpen,
  onOpenChange,
  variant = "gray",
  size = "md",
  align = "end",
  bellLabel = (n) => (n ? `Notifications, ${n} unread` : "Notifications"),
  contentClassName,
  className,
  maxHeight = "min(28rem, 70dvh)",
  ...props
}: NotificationBellProps) {
  const unread = props.unreadCount ?? props.items.filter((i) => !i.read).length;
  return (
    <Primitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <Primitive.Trigger asChild>
        <IconButton aria-label={bellLabel(unread)} variant={variant} size={size} className={cn("relative overflow-visible", className)}>
          <BellIcon />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute -end-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-danger px-1 text-caption2 font-semibold text-on-status shadow-[0_0_0_2px_var(--pl-bg)] pl-tabular"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </IconButton>
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          align={align}
          sideOffset={8}
          collisionPadding={8}
          className={cn(
            "pl-pop z-(--pl-z-dropdown) w-[24rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl bg-elevated text-fg shadow-xl outline-none",
            "[--radix-popper-transform-origin:var(--radix-popover-content-transform-origin)]",
            contentClassName,
          )}
        >
          <NotificationCenter maxHeight={maxHeight} {...props} />
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
