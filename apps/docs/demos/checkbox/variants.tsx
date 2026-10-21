import { Checkbox } from "pleate/checkbox";

export default function Demo() {
  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-4">
        <Checkbox aria-label="Small" size="sm" defaultChecked />
        <Checkbox aria-label="Medium" defaultChecked />
        <Checkbox aria-label="Large" size="lg" defaultChecked />
        <Checkbox aria-label="Square" shape="square" defaultChecked />
        <Checkbox aria-label="Square large" shape="square" size="lg" />
        <Checkbox aria-label="Disabled" disabled defaultChecked />
      </div>
      <Checkbox
        shape="square"
        label="Email me trip updates"
        description="Price drops, gate changes and reminders. No spam."
        defaultChecked
      />
    </div>
  );
}
