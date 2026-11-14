import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "pleate/input-group";

export default function Demo() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-3">
      {(["sm", "md", "lg"] as const).map((size) => (
        <InputGroup key={size} size={size}>
          <InputGroupAddon>Promo</InputGroupAddon>
          <InputGroupInput aria-label={`Promo code (${size})`} placeholder="SUMMER24" />
          <InputGroupButton variant="tinted">Apply</InputGroupButton>
        </InputGroup>
      ))}
      <InputGroup variant="outline" invalid>
        <InputGroupAddon>Promo</InputGroupAddon>
        <InputGroupInput aria-label="Promo code (invalid)" defaultValue="EXPIRED" />
        <InputGroupButton variant="tinted">Apply</InputGroupButton>
      </InputGroup>
    </div>
  );
}
