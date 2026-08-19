export interface FloorPlanImage {
  name: string;
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export type MarkerKind = "desk" | "printer" | "chair" | "meeting" | "other";

export interface MarkerKindOption {
  kind: MarkerKind;
  icon: string;
  label: string;
}

export const MARKER_KIND_OPTIONS: MarkerKindOption[] = [
  { kind: "desk", icon: "🖥️", label: "Desk" },
  { kind: "printer", icon: "🖨️", label: "Printer" },
  { kind: "chair", icon: "🪑", label: "Chair" },
  { kind: "meeting", icon: "👥", label: "Meeting room" },
  { kind: "other", icon: "📍", label: "Other" },
];

export const DEFAULT_MARKER_KIND: MarkerKindOption = MARKER_KIND_OPTIONS[0];

export interface FloorPlanMarker {
  id: string;
  label: string;
  xPct: number;
  yPct: number;
  kind: MarkerKind;
  icon: string;
}

export interface Point {
  xPct: number;
  yPct: number;
}
