import { Input } from "pleate/input";

export default function Demo() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-6">
      <div className="grid gap-3">
        <Input aria-label="Full name" placeholder="Full name (filled, default)" />
        <Input aria-label="Email" variant="outline" type="email" placeholder="Email (outline)" />
        <Input aria-label="Company" variant="surface" placeholder="Company (surface)" />
        <Input aria-label="Work email" invalid defaultValue="sofia@wayfare" />
        <Input aria-label="Account ID" disabled defaultValue="WF-20431" />
      </div>
      {/* "plain" fields inside an inset grouped card, as in iOS Settings */}
      <div className="rounded-2xl bg-bg p-4">
        <div className="divide-y divide-separator rounded-xl bg-surface ps-4">
          {[
            ["First name", "Sofia"],
            ["Last name", "Rossi"],
            ["Phone", "+39 333 120 4471"],
          ].map(([label, value]) => (
            <label key={label} className="flex min-h-11 items-center gap-4 pe-4">
              <span className="w-24 shrink-0 text-body">{label}</span>
              <Input variant="plain" defaultValue={value} className="text-fg-muted" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
