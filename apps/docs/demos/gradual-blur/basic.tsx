import { GradualBlur } from "pleate/effects/gradual-blur";

const rows = Array.from({ length: 14 }, (_, i) => `Row ${i + 1}: scroll to see the edge blur`);

export default function Demo() {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl bg-surface">
      <div className="h-full overflow-y-auto p-6 pb-24">
        {rows.map((r) => (
          <p key={r} className="border-b border-separator py-3 text-body">{r}</p>
        ))}
      </div>
      <GradualBlur position="bottom" size="7rem" strength={14} />
    </div>
  );
}
