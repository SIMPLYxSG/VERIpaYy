import { useState } from "react";
import type { AlertItem } from "@/types/floorPlan";

interface AlertCenterProps {
  alerts: AlertItem[];
  unreadCount: number;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}

export function AlertCenter({
  alerts,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
}: AlertCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);

  const displayedAlerts = filterUnread ? alerts.filter((a) => a.is_read === 0) : alerts;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-background transition-colors"
      >
        <span>🔔</span>
        <span>Alerts</span>
        {unreadCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-bold text-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-lg rounded-2xl border border-line bg-surface p-5 shadow-2xl sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-[420px]">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-ink">Movement & Security Alerts</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-danger">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-muted hover:text-ink"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterUnread(false)}
                className={`rounded-md px-2 py-1 font-medium ${
                  !filterUnread ? "bg-primary text-white" : "text-muted hover:text-ink"
                }`}
              >
                All ({alerts.length})
              </button>
              <button
                onClick={() => setFilterUnread(true)}
                className={`rounded-md px-2 py-1 font-medium ${
                  filterUnread ? "bg-primary text-white" : "text-muted hover:text-ink"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => onMarkAllRead()}
                className="text-primary hover:underline font-semibold"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-3 flex max-h-[350px] flex-col gap-2 overflow-y-auto pr-1">
            {displayedAlerts.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">No alerts to display.</p>
            ) : (
              displayedAlerts.map((alert) => {
                const isUnread = alert.is_read === 0;
                return (
                  <div
                    key={alert.id}
                    className={`flex flex-col gap-1 rounded-xl border p-3 text-xs transition-colors ${
                      isUnread
                        ? alert.severity === "danger"
                          ? "border-red-300 bg-red-50/60"
                          : "border-amber-300 bg-amber-50/60"
                        : "border-line bg-surface"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">
                          {alert.severity === "danger" ? "🚨" : alert.severity === "warning" ? "⚠️" : "ℹ️"}
                        </span>
                        <span className="font-bold text-ink">{alert.title}</span>
                      </div>
                      <span className="text-[10px] text-muted whitespace-nowrap">
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className="text-muted leading-relaxed">{alert.message}</p>

                    <div className="mt-1 flex items-center justify-end gap-3 pt-1 border-t border-line/40">
                      {isUnread && (
                        <button
                          onClick={() => onMarkRead(alert.id)}
                          className="text-[11px] font-semibold text-primary hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => onDismiss(alert.id)}
                        className="text-[11px] text-muted hover:text-danger"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
