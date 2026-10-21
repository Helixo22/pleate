"use client";

import { AlertDialog } from "pleate/alert-dialog";
import { Button } from "pleate/button";
import { toast } from "pleate/toast";

export default function Demo() {
  return (
    <>
      <AlertDialog
        trigger={<Button variant="tinted" tone="danger">Delete trip</Button>}
        title="Delete “Weekend in Lisbon”?"
        description="This removes the trip for all 4 travellers. You can't undo this."
        actions={[
          { label: "Cancel", role: "cancel" },
          { label: "Delete", role: "destructive", onSelect: () => toast.success("Trip deleted") },
        ]}
      />
      <AlertDialog
        trigger={<Button variant="gray">Three choices</Button>}
        title="Save changes?"
        description="Your itinerary has unsaved edits."
        actions={[
          { label: "Save", onSelect: () => toast.success("Saved") },
          { label: "Don't save", role: "destructive" },
          { label: "Cancel", role: "cancel" },
        ]}
      />
    </>
  );
}
