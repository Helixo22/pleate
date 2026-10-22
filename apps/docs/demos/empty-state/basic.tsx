import { MapPinned, SearchX } from "lucide-react";
import { Button } from "pleate/button";
import { EmptyState } from "pleate/empty-state";

export default function Demo() {
  return (
    <div className="grid w-full gap-4 md:grid-cols-2">
      <EmptyState
        icon={<MapPinned />}
        title="No trips yet"
        description="Plan your first getaway, invite friends and build the itinerary together."
        actions={<Button>New trip</Button>}
        bordered
      />
      <EmptyState
        size="sm"
        icon={<SearchX />}
        title="No results for “Atlantis”"
        description="Check the spelling or try a nearby city."
        actions={<Button size="sm" variant="tinted">Clear search</Button>}
      />
    </div>
  );
}
