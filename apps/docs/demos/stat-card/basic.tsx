"use client";

import { Grid } from "pleate/grid";
import { StatCard } from "pleate/stat-card";

export default function Demo() {
  return (
    <div className="w-full rounded-xl bg-bg p-4 md:p-6">
      <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        <StatCard label="Revenue" value={48230} format={(v) => `€${Math.round(v).toLocaleString("en")}`} delta={0.124} deltaLabel="vs May" />
        <StatCard label="Bookings" value={1284} format={(v) => Math.round(v).toLocaleString("en")} delta={0.068} deltaLabel="vs May" />
        <StatCard label="Cancellations" value={37} delta={-0.18} deltaLabel="vs May" invertTrend />
        <StatCard label="Avg. rating" value={4.82} format={(v) => v.toFixed(2)} delta={0.004} deltaLabel="vs May" />
      </Grid>
    </div>
  );
}
