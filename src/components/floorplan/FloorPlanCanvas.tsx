import { useRef, useState, type MouseEvent } from "react";
import type { Asset, Floor, Point } from "@/types/floorPlan";
import { getCategoryMeta } from "@/types/floorPlan";

interface FloorPlanCanvasProps {
  floor: Floor;
  assets: Asset[];
  startPoint: Point | null;
  selectedAssetId: string | null;
  isSettingStart: boolean;
  isPlacingAsset: boolean;
  isAdmin: boolean;
  onCanvasClick?: (xPct: number, yPct: number) => void;
  onSetStartPoint?: (xPct: number, yPct: number) => void;
  onSelectAsset?: (id: string | null) => void;
  onMoveAssetPosition?: (id: string, xPct: number, yPct: number) => void;
}

export function FloorPlanCanvas({
  floor,
  assets,
  startPoint,
  selectedAssetId,
  isSettingStart,
  isPlacingAsset,
  isAdmin,
  onCanvasClick,
  onSetStartPoint,
  onSelectAsset,
  onMoveAssetPosition,
}: FloorPlanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingAssetId, setDraggingAssetId] = useState<string | null>(null);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) ?? null;

  const handleContainerClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const xPct = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));

    if (isSettingStart && onSetStartPoint) {
      onSetStartPoint(xPct, yPct);
    } else if (isPlacingAsset && onCanvasClick) {
      onCanvasClick(xPct, yPct);
    } else if (!isAdmin && onSelectAsset) {
      // clicking background deselects
      // onSelectAsset(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, assetId: string) => {
    if (!isAdmin) return;
    setDraggingAssetId(assetId);
    e.dataTransfer.setData("text/plain", assetId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isAdmin || !draggingAssetId || !onMoveAssetPosition) return;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const xPct = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));

    onMoveAssetPosition(draggingAssetId, xPct, yPct);
    setDraggingAssetId(null);
  };

  const hasImage = Boolean(floor.image_data);
  const aspectRatio = floor.image_width && floor.image_height
    ? `${floor.image_width} / ${floor.image_height}`
    : "1000 / 650";

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative w-full overflow-hidden rounded-2xl border-2 border-line bg-surface shadow-card select-none ${
        isSettingStart
          ? "cursor-crosshair ring-2 ring-primary"
          : isPlacingAsset
          ? "cursor-cell ring-2 ring-amber-500"
          : "cursor-default"
      }`}
      style={{ aspectRatio }}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={floor.image_data!}
          alt={floor.name}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-50 text-muted">
          <p className="text-sm">No floor plan image uploaded yet.</p>
        </div>
      )}

      {/* Walking navigation route */}
      {startPoint && selectedAsset && selectedAsset.status === "present" && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#315C45" />
            </marker>
          </defs>
          <line
            x1={startPoint.xPct}
            y1={startPoint.yPct}
            x2={selectedAsset.x_pct}
            y2={selectedAsset.y_pct}
            stroke="#315C45"
            strokeWidth="0.8"
            strokeDasharray="2 1.5"
            markerEnd="url(#arrowhead)"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {/* User's current location pin */}
      {startPoint && (
        <div
          title="Your current location"
          className="absolute z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-primary text-xs shadow-lg animate-bounce"
          style={{ left: `${startPoint.xPct}%`, top: `${startPoint.yPct}%` }}
        >
          🧭
        </div>
      )}

      {/* Asset Markers */}
      {assets.map((asset) => {
        const isSelected = asset.id === selectedAssetId;
        const meta = getCategoryMeta(asset.category);
        const isRemoved = asset.status === "removed";

        if (isRemoved) return null; // Don't show removed items on active floor map

        return (
          <div
            key={asset.id}
            draggable={isAdmin}
            onDragStart={(e) => handleDragStart(e, asset.id)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectAsset?.(asset.id);
            }}
            title={`${asset.code}: ${asset.name} (${meta.label})`}
            className={`group absolute z-20 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-full px-2 py-1 text-xs shadow-md transition-all ${
              isAdmin ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
            } ${
              isSelected
                ? "bg-primary text-white ring-4 ring-primary/30 scale-110 font-bold"
                : "border border-line bg-white/95 text-ink hover:scale-105 hover:bg-white"
            }`}
            style={{ left: `${asset.x_pct}%`, top: `${asset.y_pct}%` }}
          >
            <span className="text-sm">{meta.icon}</span>
            <span className="font-mono text-[11px] font-bold">{asset.code}</span>
          </div>
        );
      })}
    </div>
  );
}
