import { Input } from "pleate/input";

export default function Demo() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-3">
      <Input placeholder="Filled (default)" />
      <Input variant="outline" placeholder="Outline" />
      <Input variant="surface" placeholder="Surface, for gray grouped pages" />
      <Input placeholder="Invalid" invalid defaultValue="not-an-email" />
      <Input placeholder="Disabled" disabled />
    </div>
  );
}
