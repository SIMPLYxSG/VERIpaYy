import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../db";
import { ok, fail } from "../utils/response";
import { requireAuth, requireRole } from "../middleware/auth";
import type { Asset, AssetCategory, AssetLog, UserRow } from "../types";

export const assetsRouter = Router();

const CATEGORY_PREFIXES: Record<AssetCategory, string> = {
  laptop: "LAP",
  monitor: "MON",
  keyboard: "KEY",
  mouse: "MOU",
  printer: "PRN",
  desk: "DSK",
  chair: "CHR",
  meeting: "MR",
  other: "AST",
};

export function generateNextAssetCode(category: AssetCategory): string {
  const prefix = CATEGORY_PREFIXES[category] || "AST";
  const rows = db
    .prepare("SELECT code FROM assets WHERE code LIKE ?")
    .all(`${prefix}%`) as { code: string }[];

  let maxNum = 0;
  for (const row of rows) {
    const numPart = row.code.slice(prefix.length);
    const num = parseInt(numPart, 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}${nextNum.toString().padStart(3, "0")}`;
}

// Log movement helper
export function logAssetMovement(params: {
  assetId: string;
  assetCode: string;
  assetName: string;
  action: "added" | "moved" | "removed" | "floor_changed" | "status_changed";
  fromFloorId?: string | null;
  toFloorId?: string | null;
  fromLocation?: string | null;
  toLocation?: string | null;
  userId?: string | null;
  userName?: string | null;
  isUnusual?: boolean;
  note?: string | null;
}) {
  const logId = randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO asset_logs (
      id, asset_id, asset_code, asset_name, action,
      from_floor_id, to_floor_id, from_location, to_location,
      user_id, user_name, is_unusual, note, created_at
    ) VALUES (
      @id, @asset_id, @asset_code, @asset_name, @action,
      @from_floor_id, @to_floor_id, @from_location, @to_location,
      @user_id, @user_name, @is_unusual, @note, @created_at
    )
  `).run({
    id: logId,
    asset_id: params.assetId,
    asset_code: params.assetCode,
    asset_name: params.assetName,
    action: params.action,
    from_floor_id: params.fromFloorId ?? null,
    to_floor_id: params.toFloorId ?? null,
    from_location: params.fromLocation ?? null,
    to_location: params.toLocation ?? null,
    user_id: params.userId ?? null,
    user_name: params.userName ?? null,
    is_unusual: params.isUnusual ? 1 : 0,
    note: params.note ?? null,
    created_at: now,
  });
}

// Create alert helper
export function createAlert(params: {
  title: string;
  message: string;
  severity?: "info" | "warning" | "danger";
  assetId?: string | null;
  floorId?: string | null;
}) {
  const alertId = randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO alerts (id, title, message, severity, asset_id, floor_id, is_read, created_at)
    VALUES (@id, @title, @message, @severity, @asset_id, @floor_id, 0, @created_at)
  `).run({
    id: alertId,
    title: params.title,
    message: params.message,
    severity: params.severity ?? "warning",
    asset_id: params.assetId ?? null,
    floor_id: params.floorId ?? null,
    created_at: now,
  });
}

// Get all assets
assetsRouter.get("/assets", requireAuth, (req, res) => {
  const { floor_id, status } = req.query;

  let query = `
    SELECT a.*, u.name as assigned_employee_name, f.name as floor_name
    FROM assets a
    LEFT JOIN users u ON a.assigned_to = u.id
    LEFT JOIN floors f ON a.floor_id = f.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (floor_id) {
    query += " AND a.floor_id = ?";
    params.push(floor_id as string);
  }

  if (status) {
    query += " AND a.status = ?";
    params.push(status as string);
  }

  query += " ORDER BY a.category ASC, a.code ASC";

  const assets = db.prepare(query).all(...params) as unknown as Asset[];
  ok(res, { assets });
});

// Get next suggested code for category
assetsRouter.get("/assets/suggest-code", requireAuth, (req, res) => {
  const category = (req.query.category as AssetCategory) || "other";
  const code = generateNextAssetCode(category);
  ok(res, { code });
});

// Overall stats
assetsRouter.get("/assets/stats", requireAuth, (_req, res) => {
  const total = db.prepare("SELECT COUNT(*) as count FROM assets").get() as { count: number };
  const present = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'present'").get() as { count: number };
  const removed = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'removed'").get() as { count: number };
  const inTransit = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'in_transit'").get() as { count: number };

  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as count, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count
    FROM assets
    GROUP BY category
  `).all() as { category: string; count: number; present_count: number }[];

  const byFloor = db.prepare(`
    SELECT f.id as floor_id, f.name as floor_name, f.floor_number,
           COUNT(a.id) as total_items,
           SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_items
    FROM floors f
    LEFT JOIN assets a ON f.id = a.floor_id
    GROUP BY f.id
    ORDER BY f.floor_number ASC
  `).all() as { floor_id: string; floor_name: string; floor_number: number; total_items: number; present_items: number }[];

  ok(res, {
    total: total.count,
    present: present.count,
    removed: removed.count,
    in_transit: inTransit.count,
    byCategory,
    byFloor,
  });
});

const createAssetSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  category: z.enum(["laptop", "monitor", "keyboard", "mouse", "printer", "desk", "chair", "meeting", "other"]),
  floor_id: z.string().min(1),
  x_pct: z.number().min(0).max(100).default(50),
  y_pct: z.number().min(0).max(100).default(50),
  assigned_to: z.string().nullable().optional(),
});

// Create asset (Admin only)
assetsRouter.post("/admin/assets", requireAuth, requireRole("admin"), (req, res) => {
  const parsed = createAssetSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId as string) as UserRow | undefined;
  const { name, category, floor_id, x_pct, y_pct, assigned_to } = parsed.data;

  let code = parsed.data.code?.trim();
  if (!code) {
    code = generateNextAssetCode(category);
  }

  // Check code uniqueness
  const existing = db.prepare("SELECT id FROM assets WHERE code = ?").get(code);
  if (existing) {
    return fail(res, `Asset code "${code}" already exists`, 409);
  }

  const floor = db.prepare("SELECT name FROM floors WHERE id = ?").get(floor_id) as { name: string } | undefined;
  const floorName = floor?.name ?? `Floor ID ${floor_id}`;

  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO assets (id, code, name, category, floor_id, x_pct, y_pct, status, assigned_to, updated_at, created_at)
    VALUES (@id, @code, @name, @category, @floor_id, @x_pct, @y_pct, 'present', @assigned_to, @updated_at, @created_at)
  `).run({
    id,
    code,
    name,
    category,
    floor_id,
    x_pct,
    y_pct,
    assigned_to: assigned_to ?? null,
    updated_at: now,
    created_at: now,
  });

  // Log movement & alert admin for newly added item
  logAssetMovement({
    assetId: id,
    assetCode: code,
    assetName: name,
    action: "added",
    toFloorId: floor_id,
    toLocation: `(${x_pct.toFixed(1)}%, ${y_pct.toFixed(1)}%)`,
    userId: user?.id,
    userName: user?.name,
    isUnusual: true,
    note: `New asset ${code} (${name}) registered on ${floorName}`,
  });

  createAlert({
    title: "Item Added",
    message: `New item ${code} - ${name} (${category}) added on ${floorName}`,
    severity: "info",
    assetId: id,
    floorId: floor_id,
  });

  const created = db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as unknown as Asset;
  ok(res, { asset: created }, "Asset created successfully", 201);
});

// Batch update asset layout positions (Admin only)
assetsRouter.put("/admin/assets/layout/batch", requireAuth, requireRole("admin"), (req, res) => {
  const schema = z.object({
    floor_id: z.string().min(1),
    markers: z.array(
      z.object({
        id: z.string().min(1),
        x_pct: z.number().min(0).max(100),
        y_pct: z.number().min(0).max(100),
      })
    ),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.issues[0]?.message ?? "Invalid layout data", 400);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId as string) as UserRow | undefined;
  const { floor_id, markers } = parsed.data;
  const now = new Date().toISOString();

  const floor = db.prepare("SELECT name FROM floors WHERE id = ?").get(floor_id) as { name: string } | undefined;
  const floorName = floor?.name ?? `Floor ID ${floor_id}`;

  let movedCount = 0;
  for (const marker of markers) {
    const existing = db.prepare("SELECT * FROM assets WHERE id = ?").get(marker.id) as Asset | undefined;
    if (existing) {
      const diffX = Math.abs(existing.x_pct - marker.x_pct);
      const diffY = Math.abs(existing.y_pct - marker.y_pct);
      if (diffX > 0.5 || diffY > 0.5) {
        db.prepare(`
          UPDATE assets
          SET x_pct = @x_pct, y_pct = @y_pct, updated_at = @updated_at
          WHERE id = @id
        `).run({
          id: marker.id,
          x_pct: marker.x_pct,
          y_pct: marker.y_pct,
          updated_at: now,
        });

        logAssetMovement({
          assetId: existing.id,
          assetCode: existing.code,
          assetName: existing.name,
          action: "moved",
          fromFloorId: existing.floor_id,
          toFloorId: existing.floor_id,
          fromLocation: `(${existing.x_pct.toFixed(1)}%, ${existing.y_pct.toFixed(1)}%)`,
          toLocation: `(${marker.x_pct.toFixed(1)}%, ${marker.y_pct.toFixed(1)}%)`,
          userId: user?.id,
          userName: user?.name,
          isUnusual: false,
          note: `Relocated on ${floorName}`,
        });
        movedCount++;
      }
    }
  }

  ok(res, { movedCount }, "Layout saved successfully");
});

// Update asset (Admin only)
assetsRouter.put("/admin/assets/:id", requireAuth, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  const existing = db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as Asset | undefined;
  if (!existing) return fail(res, "Asset not found", 404);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId as string) as UserRow | undefined;

  const updateSchema = z.object({
    code: z.string().optional(),
    name: z.string().min(1).optional(),
    category: z.enum(["laptop", "monitor", "keyboard", "mouse", "printer", "desk", "chair", "meeting", "other"]).optional(),
    floor_id: z.string().optional(),
    x_pct: z.number().min(0).max(100).optional(),
    y_pct: z.number().min(0).max(100).optional(),
    status: z.enum(["present", "removed", "in_transit", "maintenance"]).optional(),
    assigned_to: z.string().nullable().optional(),
  });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const fields = parsed.data;

  // Code uniqueness check if changing code
  if (fields.code && fields.code !== existing.code) {
    const dup = db.prepare("SELECT id FROM assets WHERE code = ? AND id != ?").get(fields.code, id);
    if (dup) return fail(res, `Asset code "${fields.code}" is already in use`, 409);
  }

  const updatedAsset: Asset = {
    ...existing,
    code: fields.code ?? existing.code,
    name: fields.name ?? existing.name,
    category: fields.category ?? existing.category,
    floor_id: fields.floor_id ?? existing.floor_id,
    x_pct: fields.x_pct ?? existing.x_pct,
    y_pct: fields.y_pct ?? existing.y_pct,
    status: fields.status ?? existing.status,
    assigned_to: fields.assigned_to !== undefined ? fields.assigned_to : existing.assigned_to,
    updated_at: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE assets
    SET code = @code,
        name = @name,
        category = @category,
        floor_id = @floor_id,
        x_pct = @x_pct,
        y_pct = @y_pct,
        status = @status,
        assigned_to = @assigned_to,
        updated_at = @updated_at
    WHERE id = @id
  `).run({
    id,
    code: updatedAsset.code,
    name: updatedAsset.name,
    category: updatedAsset.category,
    floor_id: updatedAsset.floor_id,
    x_pct: updatedAsset.x_pct,
    y_pct: updatedAsset.y_pct,
    status: updatedAsset.status,
    assigned_to: updatedAsset.assigned_to,
    updated_at: updatedAsset.updated_at,
  });

  // Check if floor changed
  if (fields.floor_id && fields.floor_id !== existing.floor_id) {
    logAssetMovement({
      assetId: id,
      assetCode: updatedAsset.code,
      assetName: updatedAsset.name,
      action: "floor_changed",
      fromFloorId: existing.floor_id,
      toFloorId: fields.floor_id,
      userId: user?.id,
      userName: user?.name,
      isUnusual: true,
      note: `Moved to different floor`,
    });
    createAlert({
      title: "Unusual Movement: Floor Changed",
      message: `Asset ${updatedAsset.code} (${updatedAsset.name}) was transferred across floors`,
      severity: "warning",
      assetId: id,
      floorId: fields.floor_id,
    });
  }

  // Check if status changed
  if (fields.status && fields.status !== existing.status) {
    const isUnusual = fields.status === "removed";
    logAssetMovement({
      assetId: id,
      assetCode: updatedAsset.code,
      assetName: updatedAsset.name,
      action: "status_changed",
      fromFloorId: existing.floor_id,
      toFloorId: existing.floor_id,
      userId: user?.id,
      userName: user?.name,
      isUnusual,
      note: `Status changed from ${existing.status} to ${fields.status}`,
    });

    if (fields.status === "removed") {
      createAlert({
        title: "Unusual Movement: Item Removed",
        message: `Asset ${updatedAsset.code} (${updatedAsset.name}) was marked as REMOVED`,
        severity: "danger",
        assetId: id,
        floorId: existing.floor_id,
      });
    }
  }

  ok(res, { asset: updatedAsset }, "Asset updated");
});

// Delete / Remove asset (Admin only)
assetsRouter.delete("/admin/assets/:id", requireAuth, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  const existing = db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as Asset | undefined;
  if (!existing) return fail(res, "Asset not found", 404);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId as string) as UserRow | undefined;
  const floor = db.prepare("SELECT name FROM floors WHERE id = ?").get(existing.floor_id) as { name: string } | undefined;
  const floorName = floor?.name ?? `Floor ID ${existing.floor_id}`;

  // Log removal as unusual movement
  logAssetMovement({
    assetId: id,
    assetCode: existing.code,
    assetName: existing.name,
    action: "removed",
    fromFloorId: existing.floor_id,
    fromLocation: `(${existing.x_pct.toFixed(1)}%, ${existing.y_pct.toFixed(1)}%)`,
    userId: user?.id,
    userName: user?.name,
    isUnusual: true,
    note: `Asset deleted from ${floorName}`,
  });

  createAlert({
    title: "Unusual Movement: Item Deleted",
    message: `Asset ${existing.code} - ${existing.name} was removed from ${floorName}`,
    severity: "danger",
    assetId: null,
    floorId: existing.floor_id,
  });

  db.prepare("DELETE FROM assets WHERE id = ?").run(id);

  ok(res, { id }, "Asset deleted successfully");
});

// Get movement logs
assetsRouter.get("/asset-logs", requireAuth, (req, res) => {
  const { floor_id, asset_id, is_unusual, limit = "100" } = req.query;

  let query = `
    SELECT l.*,
           f1.name as from_floor_name,
           f2.name as to_floor_name
    FROM asset_logs l
    LEFT JOIN floors f1 ON l.from_floor_id = f1.id
    LEFT JOIN floors f2 ON l.to_floor_id = f2.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (floor_id) {
    query += " AND (l.from_floor_id = ? OR l.to_floor_id = ?)";
    params.push(floor_id as string, floor_id as string);
  }

  if (asset_id) {
    query += " AND l.asset_id = ?";
    params.push(asset_id as string);
  }

  if (is_unusual !== undefined && is_unusual !== "") {
    query += " AND l.is_unusual = ?";
    params.push(is_unusual === "true" || is_unusual === "1" ? 1 : 0);
  }

  query += " ORDER BY l.created_at DESC LIMIT ?";
  params.push(parseInt(limit as string, 10) || 100);

  const logs = db.prepare(query).all(...params) as unknown as AssetLog[];
  ok(res, { logs });
});
