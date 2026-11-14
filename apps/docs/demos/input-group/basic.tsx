"use client";

import { Copy, Euro, Link2, Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, inputGroupSlot } from "pleate/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "pleate/select";
import { useState } from "react";

export default function Demo() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mx-auto grid w-full max-w-md gap-4">
      <InputGroup>
        <InputGroupAddon>https://</InputGroupAddon>
        <InputGroupInput aria-label="Trip link" defaultValue="plate.app/t/lisbon-weekend" />
        <InputGroupAddon>.com</InputGroupAddon>
      </InputGroup>
      <InputGroup variant="outline">
        <InputGroupAddon>
          <Euro />
        </InputGroupAddon>
        <InputGroupInput aria-label="Budget per person" inputMode="decimal" placeholder="0.00" defaultValue="450" />
        <InputGroupAddon>per person</InputGroupAddon>
      </InputGroup>
      <InputGroup variant="outline">
        <InputGroupAddon bare>
          <Link2 />
        </InputGroupAddon>
        <InputGroupInput aria-label="Share link" readOnly defaultValue="plate.app/join/K7QX2" />
        <InputGroupButton onClick={() => setCopied(true)} onBlur={() => setCopied(false)}>
          <Copy />
          {copied ? "Copied" : "Copy"}
        </InputGroupButton>
      </InputGroup>
      <InputGroup variant="surface">
        <Select defaultValue="flights">
          <SelectTrigger variant="plain" aria-label="Search in" className={inputGroupSlot}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flights">Flights</SelectItem>
            <SelectItem value="stays">Stays</SelectItem>
            <SelectItem value="trips">My trips</SelectItem>
          </SelectContent>
        </Select>
        <InputGroupInput aria-label="Search" placeholder="Where to?" />
        <InputGroupButton variant="filled" aria-label="Search">
          <Search />
        </InputGroupButton>
      </InputGroup>
    </div>
  );
}
