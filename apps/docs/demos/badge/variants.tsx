import { Badge } from "pleate/badge";

const TONES = ["accent", "neutral", "success", "warning", "danger", "info"] as const;

export default function Demo() {
  return (
    <div className="grid gap-3">
      {(["solid", "soft", "outline"] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap gap-2">
          {TONES.map((tone) => (
            <Badge key={tone} variant={variant} tone={tone} className="capitalize">
              {tone}
            </Badge>
          ))}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm" variant="solid" tone="danger">3</Badge>
        <Badge variant="solid" tone="danger">12</Badge>
        <Badge size="lg" variant="solid" tone="danger">99+</Badge>
        <Badge dot tone="success">Online</Badge>
        <Badge dot tone="warning" size="lg">Delayed</Badge>
      </div>
    </div>
  );
}
