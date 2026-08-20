import { useState } from "react";
import type { AssetLog } from "@/types/floorPlan";

interface MovementLogViewerProps {
  logs: AssetLog[];
  onRefresh?: () => void;
}

export function MovementLogViewer({ logs, onRefresh }: MovementLogViewerProps) {
  const [onlyUnusual, setOnlyUnusual] = useState(false);
  const [search, setSearch] = useState("");

  const filteredLogs = logs.filter((log) => {
    if (onlyUnusual && !log.is_unusual) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.asset_code.toLowerCase().includes(q) ||
        log.asset_name.toLowerCase().includes(q) ||
        (log.note && log.note.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <h3 className="font-display text-lg font-bold text-ink">📜 Item Movement Logs</h3>
          <p className="text-xs text-muted">Audit trail of equipment placement and relocations.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-line bg-background px-3 py-1.5 text-xs text-ink outline-none focus:border-primary"
          />
          <button
            onClick={() => setOnlyUnusual((v) => !v)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              onlyUnusual ? "bg-amber-600 text-white" : "border border-line text-ink hover:bg-background"
            }`}
          >
            {onlyUnusual ? "⚠️ Unusual only" : "Filter Unusual"}
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="rounded-lg border border-line p-1.5 text-xs text-ink hover:bg-background"
              title="Refresh logs"
            >
              🔄
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">No movement logs recorded.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-background/50 text-[11px] uppercase tracking-wider text-muted sticky top-0">
              <tr>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Item</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Location / Note</th>
                <th className="py-2 px-3">Movement Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-background/40 transition-colors">
                  <td className="py-2 px-3 text-muted whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-mono font-bold text-primary mr-1.5">{log.asset_code}</span>
                    <span className="text-ink">{log.asset_name}</span>
                  </td>
                  <td className="py-2 px-3 capitalize">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        log.action === "added"
                          ? "bg-emerald-100 text-emerald-800"
                          : log.action === "removed"
                          ? "bg-red-100 text-danger"
                          : log.action === "floor_changed"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {log.action.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-muted">
                    {log.note || (log.to_location ? `Moved to ${log.to_location}` : "—")}
                  </td>
                  <td className="py-2 px-3">
                    {log.is_unusual ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        ⚠️ Unusual
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Standard</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
