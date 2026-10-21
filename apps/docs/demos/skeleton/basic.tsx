import { Skeleton, SkeletonText } from "pleate/skeleton";

export default function Demo() {
  return (
    <div aria-busy="true" className="grid w-full max-w-md gap-4 rounded-2xl bg-surface p-5 shadow-[inset_0_0_0_1px_var(--pl-separator)]">
      <span className="sr-only">Loading trip…</span>
      <div className="flex items-center gap-3">
        <Skeleton shape="circle" width={44} />
        <div className="grid flex-1 gap-2">
          <Skeleton shape="text" width="50%" />
          <Skeleton shape="text" width="30%" className="text-footnote" />
        </div>
      </div>
      <Skeleton height={160} className="rounded-xl" />
      <SkeletonText lines={3} />
    </div>
  );
}
