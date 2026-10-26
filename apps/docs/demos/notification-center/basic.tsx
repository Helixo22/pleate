"use client";

import { AtSign, CalendarDays, ChefHat, CreditCard, UserPlus } from "lucide-react";
import { NotificationBell, NotificationCenter, type NotificationItem } from "pleate/notification-center";
import { useState } from "react";

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);
const ICONS = { comment: <AtSign />, invite: <UserPlus />, plan: <CalendarDays />, recipe: <ChefHat />, billing: <CreditCard /> };

const INITIAL: NotificationItem[] = [
  { id: "1", kind: "comment", title: "Marco mentioned you", body: "\"Can we swap Thursday's risotto for the miso salmon?\"", createdAt: ago(3), read: false, href: "#comment" },
  { id: "2", kind: "invite", title: "Lena joined your household", createdAt: ago(42), read: false },
  { id: "3", kind: "plan", title: "Next week's plan is ready", body: "14 meals, 3 new recipes, one shopping list.", createdAt: ago(60 * 3), read: true },
  { id: "4", kind: "recipe", title: "Your lemon tart got 12 saves", createdAt: ago(60 * 30), read: true },
  { id: "5", kind: "billing", title: "Receipt for October", body: "Plate Family, 6.99 EUR", createdAt: ago(60 * 24 * 4), read: true },
];
const OLDER: NotificationItem[] = [
  { id: "6", kind: "recipe", title: "New seasonal recipes", body: "Pumpkin, chestnuts and the first citrus.", createdAt: ago(60 * 24 * 9), read: true },
  { id: "7", kind: "invite", title: "Sam accepted your invite", createdAt: ago(60 * 24 * 12), read: true },
];

function useNotifications() {
  const [items, setItems] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  return {
    items,
    loading,
    hasMore,
    icons: ICONS,
    onMarkRead: (id: string) => setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n))),
    onMarkAllRead: () => setItems((list) => list.map((n) => ({ ...n, read: true }))),
    onDelete: (id: string) => setItems((list) => list.filter((n) => n.id !== id)),
    onLoadMore: () => {
      setLoading(true);
      setTimeout(() => {
        setItems((list) => [...list, ...OLDER.filter((o) => !list.some((n) => n.id === o.id))]);
        setHasMore(false);
        setLoading(false);
      }, 900);
    },
  };
}

export default function Demo() {
  const bell = useNotifications();
  const inline = useNotifications();
  return (
    <div className="grid w-full gap-8">
      <div className="flex items-center justify-between rounded-2xl bg-bg px-4 py-3">
        <span className="text-headline">Plate</span>
        <NotificationBell {...bell} />
      </div>
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-md">
        <NotificationCenter {...inline} />
      </div>
      <div className="mx-auto grid w-full max-w-md gap-4 md:grid-cols-2 md:max-w-3xl">
        <div className="overflow-hidden rounded-2xl bg-surface shadow-md">
          <NotificationCenter items={[]} loading labels={{ title: "Loading" }} />
        </div>
        <div className="overflow-hidden rounded-2xl bg-surface shadow-md">
          <NotificationCenter items={[]} onMarkAllRead={() => {}} />
        </div>
      </div>
    </div>
  );
}
