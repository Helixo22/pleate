import { Button } from "pleate/button";

export default function Demo() {
  return (
    <div className="mx-auto grid w-full max-w-sm gap-3">
      <Button size="lg" fullWidth>Book now</Button>
      <Button size="lg" variant="plain" fullWidth>Not now</Button>
    </div>
  );
}
