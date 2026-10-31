import { NumberField } from "pleate/number-field";

export default function Demo() {
  return (
    <div className="grid w-full max-w-[10rem] gap-3">
      <NumberField aria-label="Nights, small" size="sm" defaultValue={3} min={1} max={30} />
      <NumberField aria-label="Nights, medium" defaultValue={4} min={1} max={30} />
      <NumberField aria-label="Nights, large" size="lg" defaultValue={5} min={1} max={30} />
      <NumberField aria-label="Rooms" defaultValue={1} disabled />
      <NumberField aria-label="Children" defaultValue={12} max={10} invalid />
    </div>
  );
}
