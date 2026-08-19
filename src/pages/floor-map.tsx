import { useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { FloorPlanUpload } from "@/components/floorplan/FloorPlanUpload";
import { FloorPlanCanvas } from "@/components/floorplan/FloorPlanCanvas";
import { FloorPlanAnalysis } from "@/components/floorplan/FloorPlanAnalysis";
import { MarkerList } from "@/components/floorplan/MarkerList";
import { useFloorPlan } from "@/hooks/useFloorPlan";

function directionText(start: { xPct: number; yPct: number }, target: { xPct: number; yPct: number }) {
  const dx = target.xPct - start.xPct;
  const dy = target.yPct - start.yPct;
  const horizontal = dx === 0 ? null : `${Math.abs(dx).toFixed(0)}% ${dx > 0 ? "right" : "left"}`;
  const vertical = dy === 0 ? null : `${Math.abs(dy).toFixed(0)}% ${dy > 0 ? "down" : "up"}`;
  const parts = [horizontal, vertical].filter(Boolean);
  if (parts.length === 0) return "You're already there.";
  return `≈ ${parts.join(", ")} from your location`;
}

function FloorMapContent() {
  const {
    floorPlan,
    markers,
    startPoint,
    pingedMarkerId,
    error,
    uploadFloorPlan,
    addMarker,
    renameMarker,
    setMarkerKind,
    removeMarker,
    saveMarkers,
    setStartPoint,
    pingMarker,
    reset,
  } = useFloorPlan();
  const [saved, setSaved] = useState(false);
  const [isSettingStart, setIsSettingStart] = useState(false);

  const pingedMarker = markers.find((marker) => marker.id === pingedMarkerId) ?? null;

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-ink">Floor Map</h1>
            <p className="text-sm text-muted">
              Upload a floor plan (image or PDF), tag locations, and get directions to them.
            </p>
          </div>
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Back
          </Link>
        </header>

        {error && <p className="text-sm text-danger">{error}</p>}

        {!floorPlan && <FloorPlanUpload onUpload={uploadFloorPlan} />}

        {floorPlan && (
          <>
            <FloorPlanAnalysis floorPlan={floorPlan} markerCount={markers.length} />
            <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsSettingStart((v) => !v)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      isSettingStart ? "bg-primary text-surface" : "border border-line text-ink"
                    }`}
                  >
                    {isSettingStart ? "Click the map to set your location…" : "Set your location"}
                  </button>
                  {startPoint && pingedMarker && (
                    <span className="text-xs text-muted">{directionText(startPoint, pingedMarker)}</span>
                  )}
                </div>
                <FloorPlanCanvas
                  floorPlan={floorPlan}
                  markers={markers}
                  startPoint={startPoint}
                  pingedMarkerId={pingedMarkerId}
                  isSettingStart={isSettingStart}
                  onAddMarker={(x, y) => addMarker(x, y)}
                  onSetStartPoint={(x, y) => {
                    setStartPoint({ xPct: x, yPct: y });
                    setIsSettingStart(false);
                  }}
                  onRemoveMarker={removeMarker}
                />
              </div>
              <div className="flex flex-col gap-4">
                <MarkerList
                  markers={markers}
                  pingedMarkerId={pingedMarkerId}
                  onRename={renameMarker}
                  onKindChange={setMarkerKind}
                  onRemove={removeMarker}
                  onPing={pingMarker}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      saveMarkers();
                      setSaved(true);
                      setTimeout(() => setSaved(false), 1500);
                    }}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface"
                  >
                    {saved ? "Saved!" : "Save layout"}
                  </button>
                  <button
                    onClick={reset}
                    className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink"
                  >
                    Upload another
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function FloorMapPage() {
  return (
    <AuthGate>
      <FloorMapContent />
    </AuthGate>
  );
}
