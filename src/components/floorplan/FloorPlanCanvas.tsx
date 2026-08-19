import { useRef, type MouseEvent } from "react";
import type { FloorPlanImage, FloorPlanMarker, Point } from "@/types/floorPlan";

interface FloorPlanCanvasProps {
  floorPlan: FloorPlanImage;
  markers: FloorPlanMarker[];
  startPoint: Point | null;
  pingedMarkerId: string | null;
  isSettingStart: boolean;
  onAddMarker: (xPct: number, yPct: number) => void;
  onSetStartPoint: (xPct: number, yPct: number) => void;
  onRemoveMarker: (id: string) => void;
}

export function FloorPlanCanvas({
  floorPlan,
  markers,
  startPoint,
  pingedMarkerId,
  isSettingStart,
  onAddMarker,
  onSetStartPoint,
  onRemoveMarker,
}: FloorPlanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pingedMarker = markers.find((marker) => marker.id === pingedMarkerId) ?? null;

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xPct = ((event.clientX - rect.left) / rect.width) * 100;
    const yPct = ((event.clientY - rect.top) / rect.height) * 100;
    if (isSettingStart) {
      onSetStartPoint(xPct, yPct);
    } else {
      onAddMarker(xPct, yPct);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={`relative w-full overflow-hidden rounded-xl border border-line bg-surface shadow-card ${
        isSettingStart ? "cursor-crosshair" : "cursor-copy"
      }`}
      style={{ aspectRatio: `${floorPlan.width} / ${floorPlan.height}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={floorPlan.url}
        alt="Uploaded floor plan"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
        draggable={false}
      />

      {startPoint && pingedMarker && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
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
            x2={pingedMarker.xPct}
            y2={pingedMarker.yPct}
            stroke="#315C45"
            strokeWidth="0.6"
            strokeDasharray="2 1.5"
            markerEnd="url(#arrowhead)"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {startPoint && (
        <div
          title="Your location"
          className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-surface bg-primary text-[10px] shadow-card"
          style={{ left: `${startPoint.xPct}%`, top: `${startPoint.yPct}%` }}
        >
          🧭
        </div>
      )}

      {markers.map((marker) => (
        <button
          key={marker.id}
          onClick={(event) => {
            event.stopPropagation();
            onRemoveMarker(marker.id);
          }}
          title={`${marker.label} — click to remove`}
          className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full text-sm shadow-card ${
            marker.id === pingedMarkerId ? "bg-primary ring-4 ring-primary/30" : "bg-surface"
          }`}
          style={{ left: `${marker.xPct}%`, top: `${marker.yPct}%` }}
        >
          {marker.icon}
        </button>
      ))}
    </div>
  );
}
