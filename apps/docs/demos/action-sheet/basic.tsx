"use client";

import { ActionSheet } from "pleate/action-sheet";
import { Button } from "pleate/button";
import { toast } from "pleate/toast";

export default function Demo() {
  return (
    <ActionSheet
      trigger={<Button variant="gray">Photo options</Button>}
      title="Sunset at Miradouro"
      message="Shared with 4 travellers"
      actions={[
        { label: "Save to Photos", onSelect: () => toast.success("Saved to Photos") },
        { label: "Set as trip cover", onSelect: () => toast("Cover updated") },
        { label: "Delete photo", destructive: true, onSelect: () => toast.error("Photo deleted") },
      ]}
    />
  );
}
