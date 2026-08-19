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
`);
