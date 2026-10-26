"use client";

import { Avatar } from "pleate/avatar";
import { Badge } from "pleate/badge";
import { Button } from "pleate/button";
import { DataTable, type DataTableColumn, type DataTableSort } from "pleate/data-table";
import { SegmentedControl } from "pleate/segmented-control";
import { useEffect, useState } from "react";

type Member = { id: string; name: string; email: string; role: "Owner" | "Editor" | "Viewer"; recipes: number; joined: string };

const FIRST = ["Sofia", "Omar", "Chiara", "Jonas", "Aiko", "Lena", "Marco", "Priya", "Tomás", "Elif", "Noah", "Mei"];
const LAST = ["Rossi", "Haddad", "Bianchi", "Berg", "Tanaka", "Weber", "Conti", "Shah", "García", "Kaya", "Smith", "Lin"];
const ROLES = ["Owner", "Editor", "Viewer"] as const;
const ALL: Member[] = Array.from({ length: 134 }, (_, i) => {
  const name = `${FIRST[i % 12]} ${LAST[(i + Math.floor(i / 12) * 5) % 12]}`;
  return {
    id: `m${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(/\s/g, ".").normalize("NFD").replace(/[̀-ͯ]/g, "")}@plate.app`,
    role: ROLES[i % 7 === 0 ? 0 : i % 3 === 0 ? 2 : 1],
    recipes: (i * 37) % 90,
    joined: `2026-${String((i % 9) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
  };
});
const TONE = { Owner: "accent", Editor: "success", Viewer: "neutral" } as const;

// A pretend API: filter, sort and slice on a timer, like a server would.
function fetchMembers(q: { search: string; role: string; sort: DataTableSort | null; page: number; pageSize: number }) {
  return new Promise<{ rows: Member[]; total: number }>((resolve) =>
    setTimeout(() => {
      let list = ALL.filter((m) => (q.role === "all" || m.role === q.role) && `${m.name} ${m.email}`.toLowerCase().includes(q.search.toLowerCase()));
      if (q.sort) {
        const { key, direction } = q.sort;
        list = [...list].sort((a, b) => {
          const r = String(a[key as keyof Member]).localeCompare(String(b[key as keyof Member]), undefined, { numeric: true });
          return direction === "asc" ? r : -r;
        });
      }
      resolve({ rows: list.slice((q.page - 1) * q.pageSize, q.page * q.pageSize), total: list.length });
    }, 600),
  );
}

const columns: DataTableColumn<Member>[] = [
  {
    key: "name",
    header: "Member",
    sortable: true,
    cell: (m) => (
      <span className="flex items-center gap-3">
        <Avatar name={m.name} size="sm" />
        <span className="flex min-w-0 flex-col">
          <span className="font-medium whitespace-nowrap">{m.name}</span>
          <span className="text-footnote text-fg-muted">{m.email}</span>
        </span>
      </span>
    ),
  },
  { key: "role", header: "Role", cell: (m) => <Badge tone={TONE[m.role]}>{m.role}</Badge> },
  { key: "recipes", header: "Recipes", sortable: true, align: "end", className: "pl-tabular" },
  { key: "joined", header: "Joined", sortable: true, nowrap: true, cell: (m) => new Date(m.joined).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
];

export default function Demo() {
  const pageSize = 20;
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [sort, setSort] = useState<DataTableSort | null>({ key: "name", direction: "asc" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ rows: Member[]; total: number }>({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    fetchMembers({ search, role, sort, page, pageSize }).then((result) => {
      if (!live) return;
      setData(result);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [search, role, sort, page]);

  return (
    <DataTable
      aria-label="Household members"
      columns={columns}
      rows={data.rows}
      getRowId={(m) => m.id}
      loading={loading}
      sort={sort}
      onSortChange={setSort}
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      page={page}
      pageSize={pageSize}
      total={data.total}
      pageCount={Math.max(1, Math.ceil(data.total / pageSize))}
      onPageChange={setPage}
      selectedIds={selected}
      onSelectionChange={setSelected}
      selectionActions={
        <>
          <Button size="sm" variant="gray" onClick={() => setSelected([])}>Clear</Button>
          <Button size="sm" variant="tinted" tone="danger">Remove</Button>
        </>
      }
      toolbar={
        <SegmentedControl
          size="sm"
          aria-label="Role"
          value={role}
          onValueChange={(value) => {
            setRole(value);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All" },
            { value: "Owner", label: "Owners" },
            { value: "Editor", label: "Editors" },
            { value: "Viewer", label: "Viewers" },
          ]}
        />
      }
      onRowClick={(m) => console.info("Open", m.name)}
      className="w-full"
    />
  );
}
