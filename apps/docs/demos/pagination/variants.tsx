"use client";

import { Pagination } from "pleate/pagination";
import { useState } from "react";

export default function Demo() {
  const [page, setPage] = useState(6);
  const [slide, setSlide] = useState(2);
  return (
    <div className="grid justify-items-center gap-8">
      <Pagination page={page} pageCount={20} onPageChange={setPage} />
      <Pagination page={page} pageCount={20} onPageChange={setPage} variant="compact" />
      <Pagination page={page} pageCount={20} onPageChange={setPage} size="sm" siblings={2} />
      <Pagination page={slide} pageCount={5} onPageChange={setSlide} variant="dots" label="Slides" />
    </div>
  );
}
