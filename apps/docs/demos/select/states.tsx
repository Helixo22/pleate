import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "pleate/select";

export default function Demo() {
  return (
    <div className="mx-auto grid w-full max-w-xs gap-3">
      <Select>
        <SelectTrigger invalid aria-label="Departure airport">
          <SelectValue placeholder="Departure airport" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="lis">Lisbon (LIS)</SelectItem>
          <SelectItem value="opo">Porto (OPO)</SelectItem>
        </SelectContent>
      </Select>
      <p className="-mt-1.5 text-footnote text-danger-ink">Choose where you fly from.</p>
      <Select disabled defaultValue="lis">
        <SelectTrigger aria-label="Currency">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="lis">Euro (EUR)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
