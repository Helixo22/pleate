"use client";

import { Compass, Heart, House, MessageCircle, User } from "lucide-react";
import { TabBar, TabBarItem } from "pleate/tab-bar";
import { useState } from "react";

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[26rem] w-full max-w-[20rem] flex-col justify-end overflow-hidden rounded-[2.5rem] bg-bg shadow-[inset_0_0_0_1px_var(--pl-separator)]">
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
  return (
    <>
      <Phone>
        <TabBar position="static" value={tab} onValueChange={setTab} label="Classic tabs">
          {ITEMS.map((item) => (
            <TabBarItem key={item.value} {...item} />
          ))}
        </TabBar>
      </Phone>
      <Phone>
        <TabBar position="static" variant="floating" value={tab} onValueChange={setTab} label="Floating tabs">
          {ITEMS.slice(0, 4).map((item) => (
            <TabBarItem key={item.value} {...item} />
          ))}
        </TabBar>
      </Phone>
    </>
  );
}
