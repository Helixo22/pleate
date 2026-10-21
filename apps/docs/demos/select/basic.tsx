import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "pleate/select";

export default function Demo() {
  return (
    <div className="mx-auto grid w-full max-w-xs gap-3">
      <Select defaultValue="lisbon">
        <SelectTrigger aria-label="Destination">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Europe</SelectLabel>
            <SelectItem value="lisbon">Lisbon</SelectItem>
            <SelectItem value="seville">Seville</SelectItem>
            <SelectItem value="naples">Naples</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Asia</SelectLabel>
            <SelectItem value="kyoto" description="Temples and tea houses">Kyoto</SelectItem>
            <SelectItem value="hanoi" disabled>Hanoi (sold out)</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger variant="outline" aria-label="Room type">
          <SelectValue placeholder="Room type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="single">Single</SelectItem>
          <SelectItem value="double">Double</SelectItem>
          <SelectItem value="suite">Suite</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
