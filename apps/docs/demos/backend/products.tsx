"use client";

import { Badge } from "pleate/badge";
import { DataTable, type DataTableColumn } from "pleate/data-table";
import { SegmentedControl } from "pleate/segmented-control";
import { Switch } from "pleate/switch";
import { useList } from "pleate-client/react";

// The shape of ProductSerializer in demo/catalog/views.py.
type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: string;
  stock: number;
  status: "active" | "draft" | "archived";
  created_at: string;
};

const STATUS_TONE = { active: "success", draft: "warning", archived: "neutral" } as const;
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const columns: DataTableColumn<Product>[] = [
  {
    key: "name",
    header: "Product",
    sortable: true,
    cell: (p) => (
      <span className="flex min-w-0 flex-col">
        <span className="font-medium whitespace-nowrap">{p.name}</span>
        <span className="font-mono text-caption1 text-fg-muted">{p.sku}</span>
      </span>
    ),
  },
  { key: "category", header: "Category", nowrap: true },
  { key: "status", header: "Status", cell: (p) => <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge> },
  { key: "price", header: "Price", sortable: true, align: "end", className: "pl-tabular", cell: (p) => money.format(Number(p.price)) },
  {
    key: "stock",
    header: "Stock",
    sortable: true,
    align: "end",
    className: "pl-tabular",
    cell: (p) => <span className={p.stock < 10 ? "font-semibold text-danger-ink" : undefined}>{p.stock}</span>,
  },
];

export default function ProductsDemo() {
  // GET /api/catalog/products?page=&page_size=&search=&ordering=&status=&low_stock=
  const list = useList<Product>("/catalog/products", { pageSize: 10, ordering: "name" });

  return (
    <DataTable
      aria-label="Products"
      columns={columns}
      getRowId={(p) => p.id}
      {...list.tableProps}
      toolbar={
        <div className="flex flex-wrap items-center gap-4">
          <SegmentedControl
            size="sm"
            aria-label="Status"
            value={String(list.filters.status ?? "all")}
            onValueChange={(value) => list.setFilter("status", value === "all" ? undefined : value)}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "draft", label: "Draft" },
              { value: "archived", label: "Archived" },
            ]}
          />
          <Switch
            size="sm"
            label="Low stock"
            checked={list.filters.low_stock === true}
            onCheckedChange={(on) => list.setFilter("low_stock", on || undefined)}
          />
        </div>
      }
      className="w-full"
    />
  );
}
