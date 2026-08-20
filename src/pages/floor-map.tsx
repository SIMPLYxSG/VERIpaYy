import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch, ApiError } from "@/services/api";
import { FloorSwitcher } from "@/components/floorplan/FloorSwitcher";
import { FloorPlanCanvas } from "@/components/floorplan/FloorPlanCanvas";
import { AssetManager } from "@/components/floorplan/AssetManager";
import { InventoryStats } from "@/components/floorplan/InventoryStats";
import { MovementLogViewer } from "@/components/floorplan/MovementLogViewer";
import { AlertCenter } from "@/components/floorplan/AlertCenter";
import { FloorPlanUpload } from "@/components/floorplan/FloorPlanUpload";
import { renderPdfFirstPageToDataUrl } from "@/utils/pdfToImage";
import type {
  Floor,
  Asset,
  AssetCategory,
  AssetStats,
  AssetLog,
  AlertItem,
  Point,
} from "@/types/floorPlan";

function directionText(start: Point, target: { x_pct: number; y_pct: number }) {
  const dx = target.x_pct - start.xPct;
  const dy = target.y_pct - start.yPct;
  const horizontal = dx === 0 ? null : `${Math.abs(dx).toFixed(0)}% ${dx > 0 ? "right" : "left"}`;
  const vertical = dy === 0 ? null : `${Math.abs(dy).toFixed(0)}% ${dy > 0 ? "down" : "up"}`;
  const parts = [horizontal, vertical].filter(Boolean);
  if (parts.length === 0) return "You're already right here.";
  return `≈ ${parts.join(", ")} from your current position`;
}

function FloorMapContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [floors, setFloors] = useState<Floor[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [logs, setLogs] = useState<AssetLog[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isSettingStart, setIsSettingStart] = useState(false);
  const [showUploadMapModal, setShowUploadMapModal] = useState(false);
  const [hasUnsavedLayout, setHasUnsavedLayout] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "logs">("map");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load floors
  const loadFloors = useCallback(async () => {
    try {
      const { floors: fetchedFloors } = await apiFetch<{ floors: Floor[] }>("/floors");
      setFloors(fetchedFloors);
      if (fetchedFloors.length > 0 && !activeFloorId) {
        // Default to user's assigned floor if match exists, else first floor
        const userFloor = fetchedFloors.find((f) => f.id === user?.floor_id);
        setActiveFloorId(userFloor ? userFloor.id : fetchedFloors[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load floors");
    }
  }, [activeFloorId, user?.floor_id]);

  // Load assets
  const loadAssets = useCallback(async () => {
    try {
      const { assets: fetchedAssets } = await apiFetch<{ assets: Asset[] }>("/assets");
      setAssets(fetchedAssets);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load assets");
    }
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const fetchedStats = await apiFetch<AssetStats>("/assets/stats");
      setStats(fetchedStats);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Load logs
  const loadLogs = useCallback(async () => {
    try {
      const { logs: fetchedLogs } = await apiFetch<{ logs: AssetLog[] }>("/asset-logs?limit=100");
      setLogs(fetchedLogs);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Load alerts (Admin only)
  const loadAlerts = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { alerts: fetchedAlerts, unreadCount } = await apiFetch<{
        alerts: AlertItem[];
        unreadCount: number;
      }>("/admin/alerts?limit=50");
      setAlerts(fetchedAlerts);
      setUnreadAlertsCount(unreadCount);
    } catch (err) {
      console.error(err);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadFloors();
    loadAssets();
    loadStats();
    loadLogs();
    if (isAdmin) {
      loadAlerts();
    }
  }, [loadFloors, loadAssets, loadStats, loadLogs, loadAlerts, isAdmin]);

  const activeFloor = floors.find((f) => f.id === activeFloorId) ?? floors[0] ?? null;
  const floorAssets = assets.filter((a) => a.floor_id === activeFloorId);
  const selectedAsset = assets.find((a) => a.id === selectedAssetId) ?? null;

  // Counts map for FloorSwitcher
  const itemsCountByFloor: Record<string, number> = {};
  for (const a of assets) {
    if (a.status === "present") {
      itemsCountByFloor[a.floor_id] = (itemsCountByFloor[a.floor_id] || 0) + 1;
    }
  }

  // Handle floor map upload (Admin only)
  const handleUploadFloorMap = async (file: File) => {
    if (!activeFloorId) return;
    try {
      setError(null);
      const isPdf = file.type === "application/pdf";
      const src = isPdf ? await renderPdfFirstPageToDataUrl(file) : await readFileAsDataUrl(file);

      const img = new Image();
      img.src = src;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Could not load image dimensions"));
      });

      await apiFetch(`/admin/floors/${activeFloorId}/map`, {
        method: "PUT",
        body: JSON.stringify({
          image_data: src,
          image_name: file.name,
          image_width: img.naturalWidth || 1000,
          image_height: img.naturalHeight || 650,
          image_size: file.size,
        }),
      });

      setStatusMessage("Floor map updated and saved successfully.");
      setTimeout(() => setStatusMessage(null), 3000);
      setShowUploadMapModal(false);
      loadFloors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload floor plan");
    }
  };

  // Create new floor (Admin only)
  const handleCreateFloor = async (name: string, floorNumber: number) => {
    const { floor } = await apiFetch<{ floor: Floor }>("/admin/floors", {
      method: "POST",
      body: JSON.stringify({ name, floor_number: floorNumber }),
    });
    await loadFloors();
    setActiveFloorId(floor.id);
  };

  // Add Asset (Admin only)
  const handleAddAsset = async (newAssetData: {
    code?: string;
    name: string;
    category: AssetCategory;
    floor_id: string;
    x_pct: number;
    y_pct: number;
    assigned_to?: string | null;
  }) => {
    await apiFetch("/admin/assets", {
      method: "POST",
      body: JSON.stringify(newAssetData),
    });
    await loadAssets();
    await loadStats();
    await loadLogs();
    if (isAdmin) await loadAlerts();
  };

  // Update Asset (Admin only)
  const handleUpdateAsset = async (id: string, updates: Partial<Asset>) => {
    await apiFetch(`/admin/assets/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    await loadAssets();
    await loadStats();
    await loadLogs();
    if (isAdmin) await loadAlerts();
  };

  // Delete Asset (Admin only)
  const handleDeleteAsset = async (id: string) => {
    await apiFetch(`/admin/assets/${id}`, {
      method: "DELETE",
    });
    if (selectedAssetId === id) setSelectedAssetId(null);
    await loadAssets();
    await loadStats();
    await loadLogs();
    if (isAdmin) await loadAlerts();
  };

  // Move marker position locally on canvas
  const handleMoveAssetPosition = (id: string, xPct: number, yPct: number) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, x_pct: xPct, y_pct: yPct } : a))
    );
    setHasUnsavedLayout(true);
  };

  // Save layout positions (Admin only)
  const handleSaveLayout = async () => {
    if (!activeFloorId) return;
    try {
      const markers = floorAssets.map((a) => ({
        id: a.id,
        x_pct: a.x_pct,
        y_pct: a.y_pct,
      }));

      await apiFetch("/admin/assets/layout/batch", {
        method: "PUT",
        body: JSON.stringify({
          floor_id: activeFloorId,
          markers,
        }),
      });

      setHasUnsavedLayout(false);
      setStatusMessage("Layout saved successfully!");
      setTimeout(() => setStatusMessage(null), 2500);
      loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save layout");
    }
  };

  // Alert actions
  const handleMarkAlertRead = async (id: string) => {
    await apiFetch(`/admin/alerts/${id}/read`, { method: "POST" });
    loadAlerts();
  };

  const handleMarkAllAlertsRead = async () => {
    await apiFetch("/admin/alerts/read-all", { method: "POST" });
    loadAlerts();
  };

  const handleDismissAlert = async (id: string) => {
    await apiFetch(`/admin/alerts/${id}`, { method: "DELETE" });
    loadAlerts();
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-ink">Floor Map &amp; Asset Tracker</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  isAdmin ? "bg-primary text-white" : "bg-surface border border-line text-muted"
                }`}
              >
                {isAdmin ? "Admin (Editor)" : "Employee (Viewer)"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {isAdmin
                ? "Manage building floor maps, place and monitor hardware assets, and track movements."
                : "Explore workplace layouts, locate hardware, and get directions across floors."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <AlertCenter
                alerts={alerts}
                unreadCount={unreadAlertsCount}
                onMarkRead={handleMarkAlertRead}
                onMarkAllRead={handleMarkAllAlertsRead}
                onDismiss={handleDismissAlert}
              />
            )}

            <Link
              href={isAdmin ? "/admin" : "/employee"}
              className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-background transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </header>

        {/* Notifications & Status */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-danger flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs font-bold">✕</button>
          </div>
        )}

        {statusMessage && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-xs font-bold">✕</button>
          </div>
        )}

        {/* Live Inventory Statistics */}
        <InventoryStats
          stats={stats}
          activeFloorName={activeFloor?.name}
          floorPresentCount={floorAssets.filter((a) => a.status === "present").length}
        />

        {/* Floor Navigation & Controls */}
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
          <FloorSwitcher
            floors={floors}
            activeFloorId={activeFloorId}
            isAdmin={isAdmin}
            onSelectFloor={(id) => {
              setActiveFloorId(id);
              setSelectedAssetId(null);
            }}
            onCreateFloor={handleCreateFloor}
            itemsCountByFloor={itemsCountByFloor}
          />

          {/* Navigation & Mode Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("map")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "map" ? "bg-primary text-white" : "border border-line text-ink hover:bg-background"
                }`}
              >
                🗺️ Interactive Floor Map
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "logs" ? "bg-primary text-white" : "border border-line text-ink hover:bg-background"
                }`}
              >
                📜 Movement History ({logs.length})
              </button>
            </div>

            {activeTab === "map" && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsSettingStart((v) => !v)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                    isSettingStart
                      ? "bg-primary text-white ring-2 ring-primary/40 animate-pulse"
                      : "border border-line bg-background text-ink hover:border-primary"
                  }`}
                >
                  {isSettingStart ? "🧭 Click map to set your location…" : "🧭 Set My Location"}
                </button>

                {isAdmin && (
                  <button
                    onClick={() => setShowUploadMapModal(true)}
                    className="rounded-lg border border-line bg-background px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary transition-colors"
                  >
                    📤 {activeFloor?.image_data ? "Replace Floor Map" : "Upload Floor Map"}
                  </button>
                )}
              </div>
            )}
          </div>

          {activeTab === "map" && (
            <>
              {/* Walking Directions status bar */}
              {startPoint && selectedAsset && selectedAsset.status === "present" && (
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs text-primary flex items-center justify-between">
                  <div>
                    <span className="font-bold mr-1">Directions to {selectedAsset.code} ({selectedAsset.name}):</span>
                    <span>{directionText(startPoint, selectedAsset)}</span>
                  </div>
                  <button
                    onClick={() => setSelectedAssetId(null)}
                    className="text-xs underline hover:font-bold"
                  >
                    Clear path
                  </button>
                </div>
              )}

              {activeFloor ? (
                <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
                  {/* Canvas View */}
                  <div className="flex flex-col gap-2">
                    <FloorPlanCanvas
                      floor={activeFloor}
                      assets={floorAssets}
                      startPoint={startPoint}
                      selectedAssetId={selectedAssetId}
                      isSettingStart={isSettingStart}
                      isPlacingAsset={false}
                      isAdmin={isAdmin}
                      onSetStartPoint={(xPct, yPct) => {
                        setStartPoint({ xPct, yPct });
                        setIsSettingStart(false);
                      }}
                      onSelectAsset={(id) => setSelectedAssetId(id)}
                      onMoveAssetPosition={handleMoveAssetPosition}
                    />
                    {isAdmin && (
                      <p className="text-[11px] text-muted italic">
                        💡 Tip: As Admin, you can drag and reposition asset pins anywhere on the map, then click &quot;Save Layout&quot;.
                      </p>
                    )}
                  </div>

                  {/* Asset List & Manager */}
                  <AssetManager
                    assets={floorAssets}
                    selectedAssetId={selectedAssetId}
                    activeFloorId={activeFloor.id}
                    isAdmin={isAdmin}
                    onSelectAsset={(id) => setSelectedAssetId(id)}
                    onAddAsset={handleAddAsset}
                    onUpdateAsset={handleUpdateAsset}
                    onDeleteAsset={handleDeleteAsset}
                    onSaveLayout={handleSaveLayout}
                    hasUnsavedChanges={hasUnsavedLayout}
                  />
                </div>
              ) : (
                <div className="py-12 text-center text-muted">
                  <p>No floor selected. Create a floor to get started.</p>
                </div>
              )}
            </>
          )}

          {activeTab === "logs" && (
            <MovementLogViewer logs={logs} onRefresh={loadLogs} />
          )}
        </div>

        {/* Upload Floor Map Modal (Admin only) */}
        {showUploadMapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-display text-lg font-bold text-ink">
                  Upload Floor Plan for {activeFloor?.name}
                </h3>
                <button
                  onClick={() => setShowUploadMapModal(false)}
                  className="text-xs text-muted hover:text-ink"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4">
                <FloorPlanUpload onUpload={handleUploadFloorMap} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function FloorMapPage() {
  return (
    <AuthGate>
      <FloorMapContent />
    </AuthGate>
  );
}
