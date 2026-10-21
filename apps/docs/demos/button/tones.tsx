import { Button } from "pleate/button";

export default function Demo() {
  return (
    <div className="grid gap-3">
      {(["accent", "neutral", "danger", "success"] as const).map((tone) => (
        <div key={tone} className="flex flex-wrap gap-3">
          <Button tone={tone}>Filled</Button>
          <Button tone={tone} variant="tinted">Tinted</Button>
          <Button tone={tone} variant="gray">Gray</Button>
          <Button tone={tone} variant="plain">Plain</Button>
        </div>
      ))}
    </div>
  );
}
