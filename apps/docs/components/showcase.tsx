// Home page showcase: a phone-sized card built only from pleate components, so palette and theme switches are
// visible at a glance.
"use client";

import { Bell, Moon, Plane, Wifi } from "lucide-react";
import { Avatar, AvatarGroup, Badge, Button, Checkbox, Input, Slider, Switch, Tag } from "pleate";
import { useState } from "react";

function Row({ icon, tile, children }: { icon: React.ReactNode; tile: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center gap-3 ps-4">
      <span className="grid size-7 shrink-0 place-items-center rounded-md text-on-status [&_svg]:size-4" style={{ background: tile }}>
        {icon}
      </span>
      <div className="flex min-h-12 flex-1 items-center justify-between gap-3 border-b border-separator pe-4 group-last/row:border-0">
        {children}
      </div>
    </div>
  );
}

export function Showcase() {
  const [filter, setFilter] = useState("all");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-3xl bg-bg p-4 shadow-[inset_0_0_0_1px_var(--pl-separator)]">
        <div className="overflow-hidden rounded-2xl bg-surface">
          <div className="group/row">
            <Row icon={<Plane />} tile="var(--pl-warning)">
              <span className="text-body">Airplane mode</span>
              <Switch aria-label="Airplane mode" tone="success" />
            </Row>
          </div>
          <div className="group/row">
            <Row icon={<Wifi />} tile="var(--pl-info)">
              <span className="text-body">Wi-Fi</span>
              <span className="text-body text-fg-muted">Helpintrip</span>
            </Row>
          </div>
          <div className="group/row">
            <Row icon={<Bell />} tile="var(--pl-danger)">
              <span className="text-body">Notifications</span>
              <Badge variant="solid" tone="danger">3</Badge>
            </Row>
          </div>
          <div className="group/row">
            <Row icon={<Moon />} tile="var(--pl-accent)">
              <span className="text-body">Focus</span>
              <Switch aria-label="Focus" defaultChecked />
            </Row>
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4">
          <p className="mb-3 text-footnote font-semibold text-fg-muted">Brightness</p>
          <Slider variant="bar" defaultValue={[64]} thumbLabels={["Brightness"]} />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-md">
        <div className="flex items-center gap-3">
          <Avatar name="Sofia Rossi" status="online" />
          <div className="min-w-0 flex-1">
            <p className="text-headline">Weekend in Lisbon</p>
            <p className="text-footnote text-fg-muted">3 nights · 4 travellers</p>
          </div>
          <AvatarGroup size="sm" max={2}>
            <Avatar name="Omar Haddad" />
            <Avatar name="Chiara Bianchi" />
            <Avatar name="Jonas Berg" />
          </AvatarGroup>
        </div>
        <Input aria-label="Search" placeholder="Search activities" />
        <div className="flex flex-wrap gap-2">
          {["all", "food", "culture", "night"].map((f) => (
            <Tag key={f} size="sm" selected={filter === f} onClick={() => setFilter(f)} className="capitalize">
              {f}
            </Tag>
          ))}
        </div>
        <Checkbox label="Add travel insurance" description="Covers cancellations up to €1,500." defaultChecked />
        <div className="mt-auto flex gap-2">
          <Button variant="tinted" className="flex-1">Share</Button>
          <Button className="flex-1">Book trip</Button>
        </div>
      </div>
    </div>
  );
}
