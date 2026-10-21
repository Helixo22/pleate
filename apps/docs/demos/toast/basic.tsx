"use client";

import { Button } from "pleate/button";
import { toast } from "pleate/toast";

const wait = (ms: number, fail = false) => new Promise<string>((ok, ko) => setTimeout(() => (fail ? ko(new Error("Network")) : ok("Lisbon")), ms));

export default function Demo() {
  return (
    <>
      <Button variant="gray" onClick={() => toast("Link copied")}>Default</Button>
      <Button variant="gray" onClick={() => toast.success("Trip saved", { description: "Available offline too." })}>Success</Button>
      <Button variant="gray" onClick={() => toast.error("Couldn't sync", { description: "Check your connection." })}>Error</Button>
      <Button
        variant="gray"
        onClick={() => toast("Photo deleted", { action: { label: "Undo", onClick: () => toast.success("Restored") } })}
      >
        With action
      </Button>
      <Button
        onClick={() =>
          toast.promise(wait(1800), {
            loading: "Booking…",
            success: (city) => `Booked: ${city}`,
            error: "Booking failed",
          })
        }
      >
        Promise
      </Button>
    </>
  );
}
