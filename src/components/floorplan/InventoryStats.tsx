import { ASSET_CATEGORIES, type AssetStats } from "@/types/floorPlan";

interface InventoryStatsProps {
  stats: AssetStats | null;
  activeFloorName?: string;
  floorPresentCount?: number;
}

export function InventoryStats({ stats, activeFloorName, floorPresentCount }: InventoryStatsProps) {
  if (!stats) return null;

  const categoryCountMap = new Map(
    stats.byCategory.map((c) => [c.category, { total: c.count, present: c.present_count }])
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Top summary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Present</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-ink">{stats.present}</span>
            <span className="text-xs text-muted">/ {stats.total} registered</span>
          </div>
          <p className="mt-1 text-xs text-emerald-600 font-medium">● Actively on floor</p>
        </div>

        {activeFloorName && (
          <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">On {activeFloorName}</span>
            <div className="mt-1">
              <span className="font-display text-2xl font-bold text-primary">{floorPresentCount ?? 0}</span>
            </div>
            <p className="mt-1 text-xs text-muted">Items located on active map</p>
          </div>
        )}

        <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Removed Items</span>
          <div className="mt-1">
            <span className="font-display text-2xl font-bold text-danger">{stats.removed}</span>
          </div>
          <p className="mt-1 text-xs text-muted">Decommissioned or missing</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">In Transit</span>
          <div className="mt-1">
            <span className="font-display text-2xl font-bold text-amber-600">{stats.in_transit}</span>
          </div>
          <p className="mt-1 text-xs text-muted">Relocating between floors</p>
        </div>
      </div>

      {/* Category breakdown pills */}
      <div className="rounded-xl border border-line bg-surface p-3 shadow-card">
        <span className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
          📦 Category Inventory:
        </span>
        <div className="flex flex-wrap gap-2">
          {ASSET_CATEGORIES.map((cat) => {
            const data = categoryCountMap.get(cat.category);
            const present = data?.present ?? 0;
            const total = data?.total ?? 0;
            return (
              <div
                key={cat.category}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-background px-2.5 py-1 text-xs text-ink shadow-xs"
              >
                <span className="text-sm">{cat.icon}</span>
                <span className="font-medium">{cat.label}:</span>
                <span className="font-bold text-primary">{present}</span>
                {total !== present && <span className="text-[10px] text-muted">({total})</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
