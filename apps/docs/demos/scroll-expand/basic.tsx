import { ScrollExpand } from "pleate/effects/scroll-expand";

export default function Demo() {
  return (
    <ScrollExpand className="h-[28rem] w-full">
      <img src="https://picsum.photos/seed/pleate-expand/1600/900" alt="Hills under a wide sky" className="size-full object-cover" />
    </ScrollExpand>
  );
}
