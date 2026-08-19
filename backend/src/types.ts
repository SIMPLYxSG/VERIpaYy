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
