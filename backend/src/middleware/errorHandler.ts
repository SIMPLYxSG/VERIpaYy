import type { NextFunction, Request, Response } from "express";
import { fail } from "../utils/response";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  fail(res, "Internal server error", 500);
}
