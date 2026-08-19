export type Role = "admin" | "employee";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  floor_id: string | null;
  created_at: string;
}
