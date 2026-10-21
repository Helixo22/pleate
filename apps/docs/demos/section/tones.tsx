import { Button } from "pleate/button";
import { Section } from "pleate/section";

export default function Demo() {
  return (
    <div className="w-full overflow-hidden rounded-2xl">
      <Section
        tone="dark"
        spacing="sm"
        align="center"
        eyebrow="New"
        title="A dark band on any page."
        description='tone="dark" pins the theme for this section only — tokens, palette and components follow.'
      >
        <div className="flex justify-center gap-3">
          <Button>Learn more</Button>
          <Button variant="tinted">Buy</Button>
        </div>
      </Section>
      <Section tone="accent-soft" spacing="sm" title="Tinted band" description="Uses the palette's soft accent." />
    </div>
  );
}
