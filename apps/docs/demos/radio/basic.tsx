import { Radio, RadioGroup } from "pleate/radio";

export default function Demo() {
  return (
    <div className="grid w-full max-w-md gap-8">
      <RadioGroup defaultValue="standard" aria-label="Shipping">
        <Radio value="standard" label="Standard" description="3 to 5 business days, free" />
        <Radio value="express" label="Express" description="Next day, €9.90" />
        <Radio value="pickup" label="Pick up in store" disabled description="Not available for this item" />
      </RadioGroup>
      <RadioGroup defaultValue="md" orientation="horizontal" aria-label="Size">
        <Radio value="sm" size="sm" label="Small" />
        <Radio value="md" label="Medium" />
        <Radio value="lg" size="lg" label="Large" />
      </RadioGroup>
      {/* iOS single choice list: a checkmark at the end of the chosen row */}
      <div className="grid gap-1.5 rounded-2xl bg-bg p-4">
        <p className="px-4 text-footnote text-fg-muted">Map style</p>
        <RadioGroup defaultValue="explore" aria-label="Map style" className="gap-0 divide-y divide-separator rounded-xl bg-surface ps-4">
          {[
            ["explore", "Explore"],
            ["driving", "Driving"],
            ["transit", "Transit"],
            ["satellite", "Satellite"],
          ].map(([value, label]) => (
            <div key={value} className="flex min-h-11 items-center pe-4">
              <Radio value={value} label={label} indicator="check" labelPlacement="start" />
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
