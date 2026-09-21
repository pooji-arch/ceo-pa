import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const auditLogRouter = Router();

auditLogRouter.get("/audit-log", requireAuth, async (_req, res, next) => {
  try {
    const auditLog = await prisma.auditEntry.findMany({ orderBy: { ts: "desc" }, take: 500 });
    res.json({ success: true, data: { auditLog }, error: null });
  } catch (err) {
    next(err);
  }
});
