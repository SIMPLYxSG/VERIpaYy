export type Role = "admin" | "employee";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  floor_id: string | null;
  created_at: string;
}

export interface UserRow extends User {
  password_hash: string;
}

export interface JwtPayload {
  sub: string;
  role: Role;
}

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

export interface Asset {
  id: string;
  code: string;
  name: string;
  category: AssetCategory;
  floor_id: string;
  x_pct: number;
  y_pct: number;
  status: AssetStatus;
  assigned_to: string | null;
  assigned_employee_name?: string | null;
  updated_at: string;
  created_at: string;
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
