"use client";

import { Button } from "pleate/button";
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "pleate/drawer";
import { Input } from "pleate/input";
import { Label } from "pleate/label";

const rows = [
  ["Check in", "Fri 14 May, 15:00"],
  ["Check out", "Tue 18 May, 11:00"],
  ["Guests", "3 adults"],
  ["Room", "Double with river view"],
  ["Total", "€612.00"],
];

export default function Demo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Drawer>
        <DrawerTrigger asChild>
          <Button>Booking details</Button>
        </DrawerTrigger>
        <DrawerContent side="end">
          <DrawerHeader>
            <DrawerTitle>Casa do Rio</DrawerTitle>
            <DrawerDescription>Alfama, Lisbon · confirmation LX4-2817</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <dl className="overflow-hidden rounded-xl bg-fill-3 ps-4">
              {rows.map(([term, value]) => (
                <div key={term} className="flex min-h-11 items-center justify-between gap-4 border-b border-fg/10 py-2.5 pe-4 text-body last:border-0">
                  <dt className="text-fg">{term}</dt>
                  <dd className="pl-tabular text-end text-fg-muted">{value}</dd>
                </div>
              ))}
            </dl>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="gray" tone="danger">Cancel booking</Button>
            <DrawerClose asChild>
              <Button>Done</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="surface" tone="neutral">Filters</Button>
        </DrawerTrigger>
        <DrawerContent side="start" size="sm">
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
          </DrawerHeader>
          <DrawerBody className="grid content-start gap-4">
            <div className="grid gap-2">
              <Label htmlFor="drawer-city">City</Label>
              <Input id="drawer-city" placeholder="Lisbon" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="drawer-budget">Max per night</Label>
              <Input id="drawer-budget" inputMode="numeric" placeholder="€150" />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="gray" tone="neutral">Reset</Button>
            </DrawerClose>
            <DrawerClose asChild>
              <Button>Show 24 stays</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="surface" tone="neutral">Share trip</Button>
        </DrawerTrigger>
        <DrawerContent side="bottom" size="sm">
          <DrawerHeader>
            <DrawerTitle>Share Weekend in Lisbon</DrawerTitle>
            <DrawerDescription>Anyone with the link can view the plan.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <Input readOnly aria-label="Share link" defaultValue="https://trips.example/l/lisbon-may" />
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button>Copy link</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
