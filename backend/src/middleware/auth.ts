import type { NextFunction, Request, Response } from "express";
import { verifySession } from "../utils/jwt";
import { fail } from "../utils/response";
import { db } from "../db";
import type { Role, UserRow } from "../types";

export const SESSION_COOKIE = "veripay_session";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: Role;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return fail(res, "Not authenticated", 401);

  try {
    const payload = verifySession(token);
    const row = db.prepare("SELECT id, role FROM users WHERE id = ?").get(payload.sub) as
      | Pick<UserRow, "id" | "role">
      | undefined;
    if (!row) return fail(res, "Not authenticated", 401);

    req.userId = row.id;
    req.userRole = row.role;
    next();
  } catch {
    return fail(res, "Session expired", 401);
  }
}

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.userRole !== role) return fail(res, "Forbidden", 403);
    next();
  };
}
