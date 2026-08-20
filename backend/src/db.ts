import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const dbPath = process.env.DB_PATH ?? path.join(__dirname, "..", "veripay.db");

export const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
    floor_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS floors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    floor_number INTEGER NOT NULL,
    image_data TEXT,
    image_name TEXT,
    image_width INTEGER,
    image_height INTEGER,
    image_size INTEGER,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    floor_id TEXT NOT NULL,
    x_pct REAL NOT NULL DEFAULT 50,
    y_pct REAL NOT NULL DEFAULT 50,
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'removed', 'in_transit', 'maintenance')),
    assigned_to TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS asset_logs (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    asset_code TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    action TEXT NOT NULL,
    from_floor_id TEXT,
    to_floor_id TEXT,
    from_location TEXT,
    to_location TEXT,
    user_id TEXT,
    user_name TEXT,
    is_unusual INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'warning',
    asset_id TEXT,
    floor_id TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
