import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import type { UserRow } from "./types";

function upsertUser(row: Omit<UserRow, "id" | "created_at">) {
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(row.email);
  if (existing) {
    console.log(`Skipped (already exists): ${row.email}`);
    return;
  }

  db.prepare(
    "INSERT INTO users (id, email, password_hash, name, role, floor_id, created_at) VALUES (@id, @email, @password_hash, @name, @role, @floor_id, @created_at)"
  ).run({
    id: randomUUID(),
    created_at: new Date().toISOString(),
    ...row,
  });
  console.log(`Seeded: ${row.email} / role=${row.role}`);
}

upsertUser({
  email: "admin@veripay.local",
  name: "VeriPay Admin",
  role: "admin",
  floor_id: null,
  password_hash: bcrypt.hashSync("Admin123!", 12),
});

upsertUser({
  email: "employee@veripay.local",
  name: "Sample Employee",
  role: "employee",
  floor_id: "1",
  password_hash: bcrypt.hashSync("Employee123!", 12),
});

console.log("\nDev login credentials:");
console.log("  admin@veripay.local / Admin123!");
console.log("  employee@veripay.local / Employee123!");
