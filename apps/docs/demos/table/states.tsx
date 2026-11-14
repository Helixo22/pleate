"use client";

import { Button } from "pleate/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "pleate/table";
import { useState } from "react";

export default function Demo() {
  const [state, setState] = useState<"loading" | "empty">("loading");
  return (
    <div className="grid w-full gap-4">
      <div className="flex gap-2">
        <Button size="sm" variant={state === "loading" ? "filled" : "gray"} onClick={() => setState("loading")}>Loading</Button>
        <Button size="sm" variant={state === "empty" ? "filled" : "gray"} onClick={() => setState("empty")}>Empty</Button>
      </div>
      <Table
        aria-label="Bookings"
        columns={3}
        loading={state === "loading"}
        empty={state === "empty" ? { title: "No bookings yet", description: "Bookings appear here once a guest confirms." } : undefined}
      >
        <TableHeader>
          <TableRow>
            <TableHead>Guest</TableHead>
            <TableHead>City</TableHead>
            <TableHead align="end">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody />
      </Table>
    </div>
  );
}
