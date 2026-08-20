import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../db";
import { ok, fail } from "../utils/response";
import { requireAuth, requireRole } from "../middleware/auth";
import type { User, UserRow } from "../types";

export const employeesRouter = Router();

const createEmployeeSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  floor_id: z.string().min(1),
});

function toPublicUser(row: UserRow): User {
  const { password_hash, ...user } = row;
  return user;
}

employeesRouter.post("/admin/employees", requireAuth, requireRole("admin"), (req, res) => {
  const parsed = createEmployeeSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const { email, name, password, floor_id } = parsed.data;

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return fail(res, "An account with that email already exists", 409);

  const row: UserRow = {
    id: randomUUID(),
    email,
    name,
    role: "employee",
    floor_id,
    password_hash: bcrypt.hashSync(password, 12),
    created_at: new Date().toISOString(),
  };

  db.prepare(
    "INSERT INTO users (id, email, password_hash, name, role, floor_id, created_at) VALUES (@id, @email, @password_hash, @name, @role, @floor_id, @created_at)"
  ).run(row as unknown as Record<string, string | null>);

  ok(res, { user: toPublicUser(row) }, "Employee created", 201);
});

employeesRouter.get("/admin/employees", requireAuth, requireRole("admin"), (_req, res) => {
  const rows = db
    .prepare("SELECT id, email, name, role, floor_id, created_at FROM users WHERE role = 'employee' ORDER BY created_at DESC")
    .all() as unknown as User[];
  ok(res, { employees: rows });
});

employeesRouter.delete("/admin/employees/:id", requireAuth, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  const user = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'employee'").get(id) as UserRow | undefined;
  if (!user) return fail(res, "Employee not found", 404);

  // Unassign any assets assigned to this employee
  db.prepare("UPDATE assets SET assigned_to = NULL WHERE assigned_to = ?").run(id);

  // Delete employee
  db.prepare("DELETE FROM users WHERE id = ?").run(id);

  ok(res, { id }, "Employee deleted successfully");
});

