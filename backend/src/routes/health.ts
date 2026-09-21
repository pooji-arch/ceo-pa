import { Router } from "express";
import { prisma } from "../config/prisma.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, data: { dbConnected: true }, error: null });
  } catch (err) {
    res.status(503).json({ success: false, data: { dbConnected: false }, error: { code: "DB_UNREACHABLE", message: "Database is not reachable." } });
  }
});
