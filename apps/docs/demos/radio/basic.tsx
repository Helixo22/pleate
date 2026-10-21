import { Radio, RadioGroup } from "pleate/radio";

export default function Demo() {
  return (
    <div className="grid w-full max-w-md gap-8">
      <RadioGroup defaultValue="standard" aria-label="Shipping">
        <Radio value="standard" label="Standard" description="3–5 business days, free" />
        <Radio value="express" label="Express" description="Next day, €9.90" />
        <Radio value="pickup" label="Pick up in store" disabled description="Not available for this item" />
      </RadioGroup>
      <RadioGroup defaultValue="md" orientation="horizontal" aria-label="Size">
        <Radio value="sm" size="sm" label="Small" />
        <Radio value="md" label="Medium" />
        <Radio value="lg" size="lg" label="Large" />
      </RadioGroup>
    </div>
  );
}
