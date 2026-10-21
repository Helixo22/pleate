"use client";

import { Badge } from "pleate/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "pleate/table";
import { useMemo, useState } from "react";

const BOOKINGS = [
  { id: "HT-2041", guest: "Sofia Rossi", city: "Lisbon", nights: 3, total: 384, status: "Confirmed" },
  { id: "HT-2042", guest: "Omar Haddad", city: "Kyoto", nights: 6, total: 1290, status: "Pending" },
  { id: "HT-2043", guest: "Chiara Bianchi", city: "Seville", nights: 2, total: 218, status: "Confirmed" },
  { id: "HT-2044", guest: "Jonas Berg", city: "Naples", nights: 4, total: 512, status: "Cancelled" },
  { id: "HT-2045", guest: "Aiko Tanaka", city: "Hanoi", nights: 5, total: 640, status: "Confirmed" },
];
const TONE = { Confirmed: "success", Pending: "warning", Cancelled: "neutral" } as const;
type Key = "guest" | "nights" | "total";

export default function Demo() {
  const [sort, setSort] = useState<{ key: Key; dir: "asc" | "desc" }>({ key: "total", dir: "desc" });
  const rows = useMemo(
    () =>
      [...BOOKINGS].sort((a, b) => {
        const r = a[sort.key] < b[sort.key] ? -1 : a[sort.key] > b[sort.key] ? 1 : 0;
        return sort.dir === "asc" ? r : -r;
      }),
    [sort],
  );
  const by = (key: Key) => ({
    sort: sort.key === key ? sort.dir : (false as const),
    onSort: () => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" })),
  });
  return (
    <Table stackOnMobile>
      <TableCaption>Bookings this week. On phones each row becomes a card.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Booking</TableHead>
          <TableHead {...by("guest")}>Guest</TableHead>
          <TableHead>City</TableHead>
          <TableHead align="end" {...by("nights")}>Nights</TableHead>
          <TableHead align="end" {...by("total")}>Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((b) => (
          <TableRow key={b.id}>
            <TableCell label="Booking" className="font-mono text-footnote text-fg-muted">{b.id}</TableCell>
            <TableCell label="Guest" className="font-medium">{b.guest}</TableCell>
            <TableCell label="City">{b.city}</TableCell>
            <TableCell label="Nights" align="end" className="pl-tabular">{b.nights}</TableCell>
            <TableCell label="Total" align="end" className="pl-tabular font-semibold">€{b.total.toLocaleString()}</TableCell>
            <TableCell label="Status">
              <Badge tone={TONE[b.status as keyof typeof TONE]} dot>{b.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
