"use client";

import { Pagination } from "pleate/pagination";
import { useState } from "react";

export default function Demo() {
  const [page, setPage] = useState(2);
  return (
    <div className="grid w-full gap-6">
      <Pagination page={page} pageCount={7} onPageChange={setPage} total={134} pageSize={20} className="w-full" />
      <Pagination page={page} pageCount={7} onPageChange={setPage} total={134} pageSize={20} variant="compact" size="sm" formatRange={(start, end, total) => `Recipes ${start}–${end} of ${total}`} className="w-full" />
    </div>
  );
}
