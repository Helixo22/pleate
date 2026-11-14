"use client";

import { Download, ImageIcon, Trash2 } from "lucide-react";
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
        { label: "Save to Photos", icon: <Download size={18} />, onSelect: () => toast.success("Saved to Photos") },
        { label: "Set as trip cover", icon: <ImageIcon size={18} />, onSelect: () => toast("Cover updated") },
        { label: "Delete photo", icon: <Trash2 size={18} />, destructive: true, onSelect: () => toast.error("Photo deleted") },
      ]}
    />
  );
}
