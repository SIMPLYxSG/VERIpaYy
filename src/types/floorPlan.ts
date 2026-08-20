export type AssetCategory =
  | "laptop"
  | "monitor"
  | "keyboard"
  | "mouse"
  | "printer"
  | "desk"
  | "chair"
  | "meeting"
  | "other";

export type AssetStatus = "present" | "removed" | "in_transit" | "maintenance";

export interface CategoryMeta {
  category: AssetCategory;
  prefix: string;
  icon: string;
  label: string;
}

export const ASSET_CATEGORIES: CategoryMeta[] = [
  { category: "laptop", prefix: "LAP", icon: "💻", label: "Laptop" },
  { category: "monitor", prefix: "MON", icon: "🖥️", label: "Monitor" },
  { category: "keyboard", prefix: "KEY", icon: "⌨️", label: "Keyboard" },
  { category: "mouse", prefix: "MOU", icon: "🖱️", label: "Mouse" },
  { category: "printer", prefix: "PRN", icon: "🖨️", label: "Printer" },
  { category: "desk", prefix: "DSK", icon: "🗄️", label: "Desk / Station" },
  { category: "chair", prefix: "CHR", icon: "🪑", label: "Chair" },
  { category: "meeting", prefix: "MR", icon: "👥", label: "Meeting Room" },
  { category: "other", prefix: "AST", icon: "📦", label: "Other Asset" },
];

export const DEFAULT_CATEGORY: CategoryMeta = ASSET_CATEGORIES[0];

export function getCategoryMeta(category: AssetCategory): CategoryMeta {
  return ASSET_CATEGORIES.find((c) => c.category === category) ?? ASSET_CATEGORIES[ASSET_CATEGORIES.length - 1];
}

export interface Floor {
  id: string;
  name: string;
  floor_number: number;
  image_data: string | null;
  image_name: string | null;
  image_width: number | null;
  image_height: number | null;
  image_size: number | null;
  updated_at: string;
  created_at: string;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  category: AssetCategory;
  floor_id: string;
  floor_name?: string;
  x_pct: number;
  y_pct: number;
  status: AssetStatus;
  assigned_to: string | null;
  assigned_employee_name?: string | null;
  updated_at: string;
  created_at: string;
}

export type MovementAction = "added" | "moved" | "removed" | "floor_changed" | "status_changed";

export interface AssetLog {
  id: string;
  asset_id: string;
  asset_code: string;
  asset_name: string;
  action: MovementAction;
  from_floor_id: string | null;
  to_floor_id: string | null;
  from_floor_name?: string | null;
  to_floor_name?: string | null;
  from_location: string | null;
  to_location: string | null;
  user_id: string | null;
  user_name: string | null;
  is_unusual: number;
  note: string | null;
  created_at: string;
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "danger";
  asset_id: string | null;
  floor_id: string | null;
  is_read: number;
  created_at: string;
}

export interface AssetStats {
  total: number;
  present: number;
  removed: number;
  in_transit: number;
  byCategory: { category: AssetCategory; count: number; present_count: number }[];
  byFloor: { floor_id: string; floor_name: string; floor_number: number; total_items: number; present_items: number }[];
}

export interface Point {
  xPct: number;
  yPct: number;
}

export interface FloorPlanImage {
  name: string;
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export type MarkerKind = "desk" | "printer" | "chair" | "meeting" | "other" | AssetCategory;

export interface FloorPlanMarker {
  id: string;
  label: string;
  xPct: number;
  yPct: number;
  kind: MarkerKind;
  icon: string;
}

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

