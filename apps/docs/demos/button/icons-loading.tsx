"use client";

import { ArrowRight, Download, Plus } from "lucide-react";
import { Button } from "pleate/button";
import { useState } from "react";

export default function Demo() {
  const [saving, setSaving] = useState(false);
  return (
    <>
      <Button startIcon={<Plus />}>New trip</Button>
      <Button variant="tinted" endIcon={<ArrowRight />}>Continue</Button>
      <Button variant="gray" startIcon={<Download />}>Export</Button>
      <Button
        loading={saving}
        onClick={() => {
          setSaving(true);
          setTimeout(() => setSaving(false), 1800);
        }}
      >
        Save changes
      </Button>
      <Button disabled>Disabled</Button>
    </>
  );
}
