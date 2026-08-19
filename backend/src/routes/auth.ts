import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { db } from "../db";
import { ok, fail } from "../utils/response";
import { signSession } from "../utils/jwt";
import { requireAuth, SESSION_COOKIE } from "../middleware/auth";
import type { UserRow, User } from "../types";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["admin", "employee"]),
});

function toPublicUser(row: UserRow): User {
  const { password_hash, ...user } = row;
  return user;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.COOKIE_SECURE === "true",
  maxAge: 8 * 60 * 60 * 1000,
};

authRouter.post("/auth/login", loginLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, "Invalid email, password, or role", 400);

  const { email, password, role } = parsed.data;
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;

  if (!row || row.role !== role || !bcrypt.compareSync(password, row.password_hash)) {
    return fail(res, "Invalid email or password", 401);
  }

  const token = signSession({ sub: row.id, role: row.role });
  res.cookie(SESSION_COOKIE, token, cookieOptions);
  ok(res, { user: toPublicUser(row) }, "Logged in");
});

authRouter.post("/auth/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE);
  ok(res, null, "Logged out");
});

authRouter.get("/auth/me", requireAuth, (req, res) => {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId as string) as UserRow | undefined;
  if (!row) return fail(res, "Not authenticated", 401);
  ok(res, { user: toPublicUser(row) });
});
