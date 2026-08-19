import { MARKER_KIND_OPTIONS, type FloorPlanMarker, type MarkerKind } from "@/types/floorPlan";

interface MarkerListProps {
  markers: FloorPlanMarker[];
  pingedMarkerId: string | null;
  onRename: (id: string, label: string) => void;
  onKindChange: (id: string, kind: MarkerKind) => void;
  onRemove: (id: string) => void;
  onPing: (id: string | null) => void;
}

export function MarkerList({ markers, pingedMarkerId, onRename, onKindChange, onRemove, onPing }: MarkerListProps) {
  if (markers.length === 0) {
    return <p className="text-sm text-muted">Click anywhere on the floor plan to tag a location.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {markers.map((marker) => {
        const isPinged = marker.id === pingedMarkerId;
        return (
          <li
            key={marker.id}
            className={`flex flex-col gap-2 rounded-lg border px-3 py-2 ${
              isPinged ? "border-primary bg-sage/20" : "border-line bg-surface"
            }`}
          >
            <div className="flex items-center gap-2">
              <select
                value={marker.kind}
                onChange={(event) => onKindChange(marker.id, event.target.value as MarkerKind)}
                className="rounded-md border border-line bg-background px-1 py-1 text-sm"
                aria-label="Marker type"
              >
                {MARKER_KIND_OPTIONS.map((option) => (
                  <option key={option.kind} value={option.kind}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
              <input
                value={marker.label}
                onChange={(event) => onRename(marker.id, event.target.value)}
                className="flex-1 bg-transparent text-sm text-ink outline-none"
              />
              <button onClick={() => onRemove(marker.id)} className="text-xs text-danger hover:underline">
                Remove
              </button>
            </div>
            <button
              onClick={() => onPing(isPinged ? null : marker.id)}
              className={`self-start rounded-md px-2 py-1 text-xs font-semibold ${
                isPinged ? "bg-primary text-surface" : "border border-line text-ink"
              }`}
            >
              {isPinged ? "Showing directions" : "Directions"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
