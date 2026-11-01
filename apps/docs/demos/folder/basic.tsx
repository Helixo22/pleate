import { Folder } from "pleate/effects/folder";

export default function Demo() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-16 pt-24">
      <Folder label="Receipts" items={["Jan", "Feb", "Mar"]} />
      <Folder
        label="Photos"
        size={160}
        color="#ff9f0a"
        items={[
          <img key="a" src="https://picsum.photos/id/1018/200/160" alt="" className="size-full object-cover" />,
          <img key="b" src="https://picsum.photos/id/1039/200/160" alt="" className="size-full object-cover" />,
        ]}
      />
    </div>
  );
}
