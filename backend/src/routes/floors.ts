import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../db";
import { ok, fail } from "../utils/response";
import { requireAuth, requireRole } from "../middleware/auth";
import type { Floor } from "../types";

export const floorsRouter = Router();

// Get all floors (Both Admin and Employee can read)
floorsRouter.get("/floors", requireAuth, (_req, res) => {
  const floors = db
    .prepare("SELECT * FROM floors ORDER BY floor_number ASC, created_at ASC")
    .all() as unknown as Floor[];
  ok(res, { floors });
});

// Get single floor details
floorsRouter.get("/floors/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const floor = db.prepare("SELECT * FROM floors WHERE id = ?").get(id) as Floor | undefined;
  if (!floor) return fail(res, "Floor not found", 404);
  ok(res, { floor });
});

const createFloorSchema = z.object({
  name: z.string().min(1),
  floor_number: z.number().int(),
});

// Create floor (Admin only)
floorsRouter.post("/admin/floors", requireAuth, requireRole("admin"), (req, res) => {
  const parsed = createFloorSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const { name, floor_number } = parsed.data;
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    "INSERT INTO floors (id, name, floor_number, updated_at, created_at) VALUES (@id, @name, @floor_number, @updated_at, @created_at)"
  ).run({
    id,
    name,
    floor_number,
    updated_at: now,
    created_at: now,
  });

  const created = db.prepare("SELECT * FROM floors WHERE id = ?").get(id) as unknown as Floor;
  ok(res, { floor: created }, "Floor created", 201);
});

const updateFloorMapSchema = z.object({
  image_data: z.string().min(1),
  image_name: z.string().min(1),
  image_width: z.number().positive(),
  image_height: z.number().positive(),
  image_size: z.number().positive(),
});

// Update/upload floor map image (Admin only)
floorsRouter.put("/admin/floors/:id/map", requireAuth, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  const parsed = updateFloorMapSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.issues[0]?.message ?? "Invalid map data", 400);

  const floor = db.prepare("SELECT * FROM floors WHERE id = ?").get(id) as unknown as Floor | undefined;
  if (!floor) return fail(res, "Floor not found", 404);

  const { image_data, image_name, image_width, image_height, image_size } = parsed.data;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE floors
    SET image_data = @image_data,
        image_name = @image_name,
        image_width = @image_width,
        image_height = @image_height,
        image_size = @image_size,
        updated_at = @updated_at
    WHERE id = @id
  `).run({
    id,
    image_data,
    image_name,
    image_width,
    image_height,
    image_size,
    updated_at: now,
  });

  const updated = db.prepare("SELECT * FROM floors WHERE id = ?").get(id) as unknown as Floor;
  ok(res, { floor: updated }, "Floor map updated successfully");
});

// Delete floor (Admin only)
floorsRouter.delete("/admin/floors/:id", requireAuth, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  const floor = db.prepare("SELECT * FROM floors WHERE id = ?").get(id) as Floor | undefined;
  if (!floor) return fail(res, "Floor not found", 404);

  // Delete assets on this floor
  db.prepare("DELETE FROM assets WHERE floor_id = ?").run(id);
  // Delete floor
  db.prepare("DELETE FROM floors WHERE id = ?").run(id);

  ok(res, { id }, "Floor deleted successfully");
});
