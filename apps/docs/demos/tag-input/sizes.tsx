import { TagInput } from "pleate/tag-input";

export default function Demo() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-3">
      {(["sm", "md", "lg"] as const).map((size) => (
        <TagInput key={size} size={size} aria-label={`Interests (${size})`} defaultValue={["Food", "Museums"]} placeholder="Interests" />
      ))}
      <TagInput aria-label="Interests (disabled)" disabled defaultValue={["Beaches"]} />
    </div>
  );
}
