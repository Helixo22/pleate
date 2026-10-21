"use client";

import { Euro, Plane, Star, Users } from "lucide-react";
import { Grid } from "pleate/grid";
import { StatCard } from "pleate/stat-card";

export default function Demo() {
  return (
    <div className="w-full rounded-3xl bg-bg p-4 md:p-6">
      <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        <StatCard label="Revenue" icon={<Euro />} value={48230} format={(v) => `€${Math.round(v).toLocaleString()}`} delta={0.124} deltaLabel="vs May" trend={[30, 34, 31, 38, 42, 40, 48]} />
        <StatCard label="Bookings" icon={<Plane />} value={1284} delta={0.068} trend={[90, 110, 104, 120, 118, 126, 128]} />
        <StatCard label="Travellers" icon={<Users />} value={3912} delta={-0.021} deltaLabel="vs May" trend={[400, 420, 410, 398, 402, 395, 391]} />
        <StatCard label="Avg. rating" icon={<Star />} value={4.82} format={(v) => v.toFixed(2)} delta={0.004} />
      </Grid>
    </div>
  );
}
