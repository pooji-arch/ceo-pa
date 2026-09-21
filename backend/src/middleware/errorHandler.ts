import type { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Consistent {success, data, error} envelope for every response.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, data: null, error: { code: err.code, message: err.message } });
  }
  console.error(err);
  return res.status(500).json({ success: false, data: null, error: { code: "INTERNAL_ERROR", message: "Something went wrong." } });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, data: null, error: { code: "NOT_FOUND", message: "Route not found." } });
}
