import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is required");
  return secret;
}

export function signSession(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "8h" });
}

export function verifySession(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as unknown as JwtPayload;
}
