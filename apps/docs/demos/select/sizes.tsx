import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "pleate/select";

export default function Demo() {
  return (
    <div className="mx-auto grid w-full max-w-xs gap-3">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Select key={size} defaultValue="double">
          <SelectTrigger size={size} aria-label={`Room type, ${size}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="double">Double</SelectItem>
            <SelectItem value="suite">Suite</SelectItem>
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
