import { Card } from "pleate/card";
import { UsageMeter } from "pleate/usage-meter";

export default function Demo() {
  return (
    <div className="grid w-full max-w-md gap-3 rounded-xl bg-bg p-4">
      <Card padding="sm" radius="lg">
        <UsageMeter
          label="Trip photo storage"
          unit="GB"
          max={10}
          segments={[
            { label: "Photos", value: 5.1 },
            { label: "Videos", value: 1.6 },
            { label: "Documents", value: 0.5 },
          ]}
        />
      </Card>
      <Card padding="sm" radius="lg">
        <UsageMeter
          label="Shared albums"
          unit="GB"
          max={2}
          segments={[
            { label: "Lisbon 2026", value: 1.42 },
            { label: "Porto weekend", value: 0.31 },
          ]}
        />
      </Card>
      <Card padding="sm" radius="lg">
        <UsageMeter
          label="Offline maps"
          unit="GB"
          max={4}
          segments={[
            { label: "Portugal", value: 2.9 },
            { label: "Andalusia", value: 0.95 },
          ]}
        />
      </Card>
      <p className="px-4 text-footnote text-fg-muted">Past 80% the bar turns orange, past 95% red</p>
    </div>
  );
}
