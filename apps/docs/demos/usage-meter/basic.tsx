import { UsageMeter } from "pleate/usage-meter";

export default function Demo() {
  return (
    <div className="grid w-full max-w-md gap-8">
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
      <UsageMeter
        label="Shared albums"
        unit="GB"
        max={2}
        segments={[
          { label: "Lisbon 2026", value: 1.42 },
          { label: "Porto weekend", value: 0.31 },
        ]}
      />
      <UsageMeter
        label="Offline maps"
        unit="GB"
        max={4}
        segments={[
          { label: "Portugal", value: 2.9 },
          { label: "Andalusia", value: 0.95 },
        ]}
      />
    </div>
  );
}
