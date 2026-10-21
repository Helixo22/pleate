import { Divider } from "pleate/divider";

export default function Demo() {
  return (
    <div className="grid w-full max-w-md gap-8">
      <div className="overflow-hidden rounded-2xl bg-surface shadow-[inset_0_0_0_1px_var(--pl-separator)]">
        {["General", "Privacy", "Notifications"].map((item, i) => (
          <div key={item}>
            {i > 0 && <Divider inset={4} />}
            <div className="flex h-12 items-center px-4 text-body">{item}</div>
          </div>
        ))}
      </div>
      <Divider label="or" />
      <div className="flex h-6 items-center gap-4 text-subhead">
        <span>Edit</span>
        <Divider orientation="vertical" />
        <span>Share</span>
        <Divider orientation="vertical" />
        <span>Delete</span>
      </div>
    </div>
  );
}
