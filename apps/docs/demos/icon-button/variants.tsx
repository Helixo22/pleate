import { Heart, Plus, Search, Share, Trash2 } from "lucide-react";
import { IconButton } from "pleate/icon-button";

export default function Demo() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <IconButton aria-label="Add" variant="filled" icon={<Plus />} />
        <IconButton aria-label="Like" variant="tinted" icon={<Heart />} />
        <IconButton aria-label="Search" icon={<Search />} />
        <IconButton aria-label="Share" variant="surface" icon={<Share />} />
        <IconButton aria-label="Delete" variant="tinted" tone="danger" icon={<Trash2 />} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <IconButton aria-label="Add" size="xs" icon={<Plus />} />
        <IconButton aria-label="Add" size="sm" icon={<Plus />} />
        <IconButton aria-label="Add" size="md" icon={<Plus />} />
        <IconButton aria-label="Add" size="lg" icon={<Plus />} />
        <IconButton aria-label="Add" size="xl" icon={<Plus />} />
        <IconButton aria-label="Add" size="lg" shape="rounded" variant="filled" icon={<Plus />} />
      </div>
    </div>
  );
}
