import { Button } from "pleate/button";

export default function Demo() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <Button size="xl">Extra large</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="tinted">Pill (default)</Button>
        <Button shape="rounded" variant="tinted">Rounded</Button>
        <Button size="lg" variant="tinted">Pill large</Button>
        <Button size="lg" shape="rounded" variant="tinted">Rounded large</Button>
      </div>
    </div>
  );
}
