import { Router } from "express";
import { db } from "../db";
import { ok, fail } from "../utils/response";
import { requireAuth, requireRole } from "../middleware/auth";
import type { AlertItem } from "../types";

export const alertsRouter = Router();

// Get alerts (Admin only)
alertsRouter.get("/admin/alerts", requireAuth, requireRole("admin"), (req, res) => {
  const { unread_only, limit = "50" } = req.query;

  let query = "SELECT * FROM alerts";
  const params: (string | number)[] = [];

  if (unread_only === "true" || unread_only === "1") {
    query += " WHERE is_read = 0";
  }

  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(parseInt(limit as string, 10) || 50);

  const alerts = db.prepare(query).all(...params) as unknown as AlertItem[];
  const unreadCount = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE is_read = 0").get() as unknown as { count: number };

  ok(res, { alerts, unreadCount: unreadCount.count });
});

// Mark single alert as read
alertsRouter.post("/admin/alerts/:id/read", requireAuth, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  db.prepare("UPDATE alerts SET is_read = 1 WHERE id = ?").run(id);
  ok(res, { id }, "Alert marked as read");
});

// Mark all alerts as read
alertsRouter.post("/admin/alerts/read-all", requireAuth, requireRole("admin"), (_req, res) => {
  db.prepare("UPDATE alerts SET is_read = 1").run();
  ok(res, null, "All alerts marked as read");
});

// Delete / Dismiss alert
alertsRouter.delete("/admin/alerts/:id", requireAuth, requireRole("admin"), (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM alerts WHERE id = ?").run(id);
  ok(res, { id }, "Alert dismissed");
});
