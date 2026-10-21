import { Input } from "pleate/input";

export default function Demo() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-3">
      <Input size="sm" placeholder="Small" />
      <Input size="md" placeholder="Medium" />
      <Input size="lg" placeholder="Large" />
    </div>
  );
}
