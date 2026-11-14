"use client";

import { Compass, Heart, House, MessageCircle, User } from "lucide-react";
import { TabBar, TabBarItem } from "pleate/tab-bar";
import { useState } from "react";

const SAVED = ["Time Out Market", "Miradouro da Graça", "LX Factory"];

function Phone({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex h-[26rem] w-full max-w-[20rem] flex-col overflow-hidden rounded-[2.5rem] bg-bg shadow-[inset_0_0_0_1px_var(--pl-separator)]">
      <div className="flex-1 px-5 pt-8">
        <h3 className="text-title2">{title}</h3>
        <ul className="mt-4 flex flex-col divide-y divide-separator">
          {SAVED.map((place) => (
            <li key={place} className="py-2.5 text-subhead">
              {place}
            </li>
          ))}
        </ul>
      </div>
      {children}
    </div>
  );
}

const ITEMS = [
  { value: "home", label: "Home", icon: <House /> },
  { value: "explore", label: "Explore", icon: <Compass /> },
  { value: "saved", label: "Saved", icon: <Heart />, activeIcon: <Heart fill="currentColor" /> },
  { value: "chat", label: "Chat", icon: <MessageCircle />, badge: 4 },
  { value: "me", label: "Profile", icon: <User /> },
];

export default function Demo() {
  const [tab, setTab] = useState("home");
  const title = ITEMS.find((item) => item.value === tab)?.label ?? "";
  return (
    <>
      <Phone title={title}>
        <TabBar position="static" value={tab} onValueChange={setTab} label="Classic tabs">
          {ITEMS.map((item) => (
            <TabBarItem key={item.value} {...item} />
          ))}
        </TabBar>
      </Phone>
      <Phone title={title}>
        <TabBar position="static" variant="floating" value={tab} onValueChange={setTab} label="Floating tabs">
          {ITEMS.slice(0, 4).map((item) => (
            <TabBarItem key={item.value} {...item} />
          ))}
        </TabBar>
      </Phone>
    </>
  );
}
