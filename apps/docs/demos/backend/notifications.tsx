"use client";

import { AtSign, Bell, CreditCard, Download, Package, ShieldCheck, ShoppingBag, Star, UserPlus, Webhook } from "lucide-react";
import { NotificationBell, NotificationCenter } from "pleate/notification-center";
import { useNotifications } from "pleate-client/react";
import type { ReactNode } from "react";

// Icons by the first part of the notification kind ("billing.payment_failed" uses "billing").
const ICONS: Record<string, ReactNode> = {
  billing: <CreditCard />,
  comment: <AtSign />,
  export: <Download />,
  inventory: <Package />,
  order: <ShoppingBag />,
  review: <Star />,
  security: <ShieldCheck />,
  team: <UserPlus />,
  webhook: <Webhook />,
};

export default function NotificationsDemo() {
  // Cursor paginated inbox, unread count and a live SSE stream from /api/notifications/stream.
  const inbox = useNotifications();
  const icons = Object.fromEntries(
    inbox.notificationCenterProps.items.map((n) => [n.kind, ICONS[n.kind.split(".")[0]] ?? <Bell />]),
  );

  return (
    <div className="grid w-full gap-6">
      <div className="flex items-center justify-between rounded-2xl bg-bg px-4 py-3">
        <span className="text-headline">Plate</span>
        <span className="flex items-center gap-3">
          <span className="text-footnote text-fg-muted">{inbox.unreadCount} unread</span>
          <NotificationBell {...inbox.notificationCenterProps} icons={icons} />
        </span>
      </div>
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-md">
        <NotificationCenter {...inbox.notificationCenterProps} icons={icons} maxHeight="24rem" />
      </div>
    </div>
  );
}
