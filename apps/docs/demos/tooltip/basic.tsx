import { Bookmark, Download, Share } from "lucide-react";
import { IconButton } from "pleate/icon-button";
import { Tooltip } from "pleate/tooltip";

export default function Demo() {
  return (
    <>
      <Tooltip content="Save">
        <IconButton aria-label="Save" icon={<Bookmark />} />
      </Tooltip>
      <Tooltip content="Share with travellers" side="bottom">
        <IconButton aria-label="Share" icon={<Share />} />
      </Tooltip>
      <Tooltip content="Download offline map (124 MB)" side="right">
        <IconButton aria-label="Download" icon={<Download />} />
      </Tooltip>
    </>
  );
}
