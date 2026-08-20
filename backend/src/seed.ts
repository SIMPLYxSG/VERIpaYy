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

function generateFloorSvg(title: string, subtitle: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="1000" height="650">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="1000" height="650" fill="#F8FAFC"/>
    <rect width="1000" height="650" fill="url(#grid)"/>

    <!-- Perimeter Walls -->
    <rect x="30" y="30" width="940" height="590" rx="12" fill="#FFFFFF" stroke="#334155" stroke-width="4"/>

    <!-- Conference Room 1 -->
    <rect x="50" y="50" width="260" height="180" rx="6" fill="#F1F5F9" stroke="#64748B" stroke-width="2"/>
    <text x="180" y="145" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#475569" text-anchor="middle">Conference Alpha</text>

    <!-- Conference Room 2 -->
    <rect x="50" y="250" width="260" height="170" rx="6" fill="#F1F5F9" stroke="#64748B" stroke-width="2"/>
    <text x="180" y="340" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#475569" text-anchor="middle">Meeting Beta</text>

    <!-- Cafeteria / Lounge -->
    <rect x="50" y="440" width="260" height="160" rx="6" fill="#ECFDF5" stroke="#10B981" stroke-width="2"/>
    <text x="180" y="525" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#047857" text-anchor="middle">Cafeteria / Pantry</text>

    <!-- Open Workstation Pod A -->
    <rect x="350" y="50" width="280" height="250" rx="8" fill="#F8FAFC" stroke="#94A3B8" stroke-dasharray="4 4" stroke-width="2"/>
    <text x="490" y="80" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#64748B" text-anchor="middle">Workstation Bay 1</text>
    <rect x="375" y="100" width="100" height="50" rx="4" fill="#E2E8F0" stroke="#CBD5E1"/>
    <rect x="495" y="100" width="100" height="50" rx="4" fill="#E2E8F0" stroke="#CBD5E1"/>
    <rect x="375" y="170" width="100" height="50" rx="4" fill="#E2E8F0" stroke="#CBD5E1"/>
    <rect x="495" y="170" width="100" height="50" rx="4" fill="#E2E8F0" stroke="#CBD5E1"/>

    <!-- Open Workstation Pod B -->
    <rect x="350" y="330" width="280" height="270" rx="8" fill="#F8FAFC" stroke="#94A3B8" stroke-dasharray="4 4" stroke-width="2"/>
    <text x="490" y="360" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#64748B" text-anchor="middle">Workstation Bay 2</text>
    <rect x="375" y="380" width="100" height="50" rx="4" fill="#E2E8F0" stroke="#CBD5E1"/>
    <rect x="495" y="380" width="100" height="50" rx="4" fill="#E2E8F0" stroke="#CBD5E1"/>
    <rect x="375" y="450" width="100" height="50" rx="4" fill="#E2E8F0" stroke="#CBD5E1"/>
    <rect x="495" y="450" width="100" height="50" rx="4" fill="#E2E8F0" stroke="#CBD5E1"/>

    <!-- Server & IT Hub -->
    <rect x="670" y="50" width="280" height="190" rx="6" fill="#EFF6FF" stroke="#3B82F6" stroke-width="2"/>
    <text x="810" y="150" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#1E40AF" text-anchor="middle">IT &amp; Server Room</text>

    <!-- Executive Suites -->
    <rect x="670" y="260" width="280" height="180" rx="6" fill="#FDF2F8" stroke="#EC4899" stroke-width="2"/>
    <text x="810" y="355" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#9D174D" text-anchor="middle">Management Suite</text>

    <!-- Reception & Main Lobby -->
    <rect x="670" y="460" width="280" height="140" rx="6" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2"/>
    <text x="810" y="535" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#B45309" text-anchor="middle">Lobby &amp; Entrance</text>

    <!-- Title Badge -->
    <rect x="400" y="15" width="200" height="30" rx="6" fill="#1E293B"/>
    <text x="500" y="35" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#FFFFFF" text-anchor="middle">${title} • ${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Seed Floors
const floor1Svg = generateFloorSvg("Floor 1", "Engineering & Operations");
const floor2Svg = generateFloorSvg("Floor 2", "Executive & Product");

function upsertFloor(floor: {
  id: string;
  name: string;
  floor_number: number;
  image_data: string;
  image_name: string;
  image_width: number;
  image_height: number;
  image_size: number;
}) {
  const existing = db.prepare("SELECT id FROM floors WHERE id = ?").get(floor.id);
  const now = new Date().toISOString();
  if (!existing) {
    db.prepare(`
      INSERT INTO floors (id, name, floor_number, image_data, image_name, image_width, image_height, image_size, updated_at, created_at)
      VALUES (@id, @name, @floor_number, @image_data, @image_name, @image_width, @image_height, @image_size, @updated_at, @created_at)
    `).run({
      ...floor,
      updated_at: now,
      created_at: now,
    });
    console.log(`Seeded floor: ${floor.name}`);
  }
}

upsertFloor({
  id: "floor-1",
  name: "Floor 1 - Engineering",
  floor_number: 1,
  image_data: floor1Svg,
  image_name: "floor-1-layout.svg",
  image_width: 1000,
  image_height: 650,
  image_size: floor1Svg.length,
});

upsertFloor({
  id: "floor-2",
  name: "Floor 2 - Executive",
  floor_number: 2,
  image_data: floor2Svg,
  image_name: "floor-2-layout.svg",
  image_width: 1000,
  image_height: 650,
  image_size: floor2Svg.length,
});

// Seed Initial Assets
const initialAssets = [
  { id: "ast-1", code: "LAP001", name: "MacBook Pro 16", category: "laptop", floor_id: "floor-1", x_pct: 42.5, y_pct: 19.2, status: "present" },
  { id: "ast-2", code: "LAP002", name: "ThinkPad X1 Carbon", category: "laptop", floor_id: "floor-1", x_pct: 54.5, y_pct: 19.2, status: "present" },
  { id: "ast-3", code: "MON001", name: "Dell 27-inch 4K", category: "monitor", floor_id: "floor-1", x_pct: 42.5, y_pct: 30.0, status: "present" },
  { id: "ast-4", code: "MON002", name: "LG UltraWide 34", category: "monitor", floor_id: "floor-1", x_pct: 54.5, y_pct: 30.0, status: "present" },
  { id: "ast-5", code: "KEY001", name: "Logitech MX Keys", category: "keyboard", floor_id: "floor-1", x_pct: 42.5, y_pct: 69.2, status: "present" },
  { id: "ast-6", code: "MOU001", name: "Logitech MX Master 3", category: "mouse", floor_id: "floor-1", x_pct: 54.5, y_pct: 69.2, status: "present" },
  { id: "ast-7", code: "PRN001", name: "HP LaserJet Enterprise", category: "printer", floor_id: "floor-1", x_pct: 81.0, y_pct: 23.0, status: "present" },
  { id: "ast-8", code: "MR001", name: "Alpha Conference Display", category: "meeting", floor_id: "floor-1", x_pct: 18.0, y_pct: 22.0, status: "present" },
  { id: "ast-9", code: "LAP003", name: "Dell XPS 15", category: "laptop", floor_id: "floor-2", x_pct: 81.0, y_pct: 45.0, status: "present" },
  { id: "ast-10", code: "MON003", name: "Apple Studio Display", category: "monitor", floor_id: "floor-2", x_pct: 81.0, y_pct: 55.0, status: "present" },
];

for (const asset of initialAssets) {
  const existing = db.prepare("SELECT id FROM assets WHERE id = ? OR code = ?").get(asset.id, asset.code);
  const now = new Date().toISOString();
  if (!existing) {
    db.prepare(`
      INSERT INTO assets (id, code, name, category, floor_id, x_pct, y_pct, status, assigned_to, updated_at, created_at)
      VALUES (@id, @code, @name, @category, @floor_id, @x_pct, @y_pct, @status, NULL, @updated_at, @created_at)
    `).run({
      ...asset,
      updated_at: now,
      created_at: now,
    });
    console.log(`Seeded asset: ${asset.code} - ${asset.name}`);
  }
}

// Seed sample log & alert if empty
const logCount = db.prepare("SELECT COUNT(*) as count FROM asset_logs").get() as { count: number };
if (logCount.count === 0) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO asset_logs (id, asset_id, asset_code, asset_name, action, from_floor_id, to_floor_id, from_location, to_location, user_id, user_name, is_unusual, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(), "ast-1", "LAP001", "MacBook Pro 16", "added", null, "floor-1", null, "(42.5%, 19.2%)", null, "System Seed", 1, "Initial system onboarding", now
  );

  db.prepare(`
    INSERT INTO alerts (id, title, message, severity, asset_id, floor_id, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    randomUUID(), "Initial Asset Audit", "Standard workplace assets initialized across Floor 1 & Floor 2", "info", "ast-1", "floor-1", now
  );
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
  floor_id: "floor-1",
  password_hash: bcrypt.hashSync("Employee123!", 12),
});

console.log("\nDev login credentials:");
console.log("  admin@veripay.local / Admin123!");
console.log("  employee@veripay.local / Employee123!");

