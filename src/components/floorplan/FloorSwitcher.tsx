import { useState, type FormEvent } from "react";
import type { Floor } from "@/types/floorPlan";

interface FloorSwitcherProps {
  floors: Floor[];
  activeFloorId: string | null;
  isAdmin: boolean;
  onSelectFloor: (floorId: string) => void;
  onCreateFloor?: (name: string, floorNumber: number) => Promise<void>;
  itemsCountByFloor?: Record<string, number>;
}

export function FloorSwitcher({
  floors,
  activeFloorId,
  isAdmin,
  onSelectFloor,
  onCreateFloor,
  itemsCountByFloor = {},
}: FloorSwitcherProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [floorName, setFloorName] = useState("");
  const [floorNumber, setFloorNumber] = useState(floors.length + 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!onCreateFloor) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateFloor(floorName, Number(floorNumber));
      setFloorName("");
      setFloorNumber(floors.length + 2);
      setShowAddModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create floor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted mr-1">
          🏢 Floor:
        </span>
        {floors.map((floor) => {
          const isActive = floor.id === activeFloorId;
          const count = itemsCountByFloor[floor.id] ?? 0;
          return (
            <button
              key={floor.id}
              onClick={() => onSelectFloor(floor.id)}
              className={`group flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all shadow-sm ${
                isActive
                  ? "bg-primary text-white ring-2 ring-primary/30"
                  : "border border-line bg-surface text-ink hover:border-primary/50 hover:bg-background"
              }`}
            >
              <span>{floor.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-background text-muted group-hover:text-ink"
                }`}
              >
                {count} items
              </span>
            </button>
          );
        })}

        {isAdmin && onCreateFloor && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 rounded-xl border border-dashed border-line px-3 py-2 text-sm font-semibold text-primary hover:border-primary hover:bg-primary/5 transition-colors"
            title="Add a new floor"
          >
            <span>+</span> Add Floor
          </button>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-ink">Add New Floor</h3>
            <p className="mt-1 text-sm text-muted">Create a new building floor to monitor assets.</p>

            <form onSubmit={handleAddSubmit} className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm text-ink">
                Floor Name
                <input
                  required
                  placeholder="e.g. Floor 3 - Operations"
                  value={floorName}
                  onChange={(e) => setFloorName(e.target.value)}
                  className="rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-primary"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-ink">
                Floor Number
                <input
                  type="number"
                  required
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(Number(e.target.value))}
                  className="rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-primary"
                />
              </label>

              {error && <p className="text-sm text-danger">{error}</p>}

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Creating…" : "Create Floor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
