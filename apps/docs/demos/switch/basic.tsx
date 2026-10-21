import { Switch } from "pleate/switch";

export default function Demo() {
  return (
    <div className="grid w-full max-w-sm gap-5">
      <div className="flex items-center gap-4">
        <Switch aria-label="Wi-Fi" defaultChecked />
        <Switch aria-label="Bluetooth" tone="success" defaultChecked />
        <Switch aria-label="Small" size="sm" defaultChecked />
        <Switch aria-label="Off" />
        <Switch aria-label="Disabled" disabled defaultChecked />
      </div>
      <Switch label="Airplane mode" labelPlacement="start" />
      <Switch
        label="Offline maps"
        description="Download maps for the cities in your trip."
        labelPlacement="start"
        tone="success"
        defaultChecked
      />
    </div>
  );
}
