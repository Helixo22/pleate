import { Copy, Heart, Share, Trash2 } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "pleate/context-menu";

export default function Demo() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="grid h-40 w-full max-w-sm place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--pl-accent-200),var(--pl-accent-500))] text-center text-headline text-accent-950">
        Right-click or long-press
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem icon={<Heart />}>Save</ContextMenuItem>
        <ContextMenuItem icon={<Copy />}>Copy</ContextMenuItem>
        <ContextMenuItem icon={<Share />}>Share…</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem destructive icon={<Trash2 />}>Remove</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
