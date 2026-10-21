import { Input } from "pleate/input";
import { Label } from "pleate/label";

export default function Demo() {
  return (
    <div className="mx-auto grid w-full max-w-sm gap-2">
      <Label htmlFor="full-name" required hint="As on your passport">
        Full name
      </Label>
      <Input id="full-name" placeholder="Jane Appleseed" autoComplete="name" />
    </div>
  );
}
