import { Input } from "pleate/input";

export default function Demo() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-3">
      <Input placeholder="Outline (default)" />
      <Input variant="filled" placeholder="Filled" />
      <Input variant="surface" placeholder="Surface" />
      <Input placeholder="Invalid" invalid defaultValue="not-an-email" />
      <Input placeholder="Disabled" disabled />
    </div>
  );
}
