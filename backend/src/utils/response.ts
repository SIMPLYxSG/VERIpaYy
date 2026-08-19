import type { Response } from "express";

export function ok<T>(res: Response, data: T, message = "OK", status = 200) {
  return res.status(status).json({ success: true, data, message });
}

export function fail(res: Response, message: string, status = 400) {
  return res.status(status).json({ success: false, data: null, message });
}
