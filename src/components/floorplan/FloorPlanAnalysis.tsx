import type { FloorPlanImage } from "@/types/floorPlan";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FloorPlanAnalysisProps {
  floorPlan: FloorPlanImage;
  markerCount: number;
}

export function FloorPlanAnalysis({ floorPlan, markerCount }: FloorPlanAnalysisProps) {
  const stats = [
    { label: "Dimensions", value: `${floorPlan.width} × ${floorPlan.height}px` },
    { label: "Aspect ratio", value: (floorPlan.width / floorPlan.height).toFixed(2) },
    { label: "File size", value: formatBytes(floorPlan.sizeBytes) },
    { label: "Locations tagged", value: String(markerCount) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-4 rounded-xl border border-line bg-surface p-4 shadow-card sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label}>
          <dt className="text-xs uppercase tracking-wide text-muted">{stat.label}</dt>
          <dd className="font-display text-lg text-ink">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
