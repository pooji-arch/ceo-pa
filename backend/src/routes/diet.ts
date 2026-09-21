import { Router } from "express";
import type { DietStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { toDateOnly, todayDateOnly } from "../utils/date.js";
import { dietStatusFromPrisma, dietStatusToPrisma } from "../utils/enumMap.js";
import { createDietQuerySchema, updateDietStatusSchema } from "../validation/dietSchemas.js";
import { logAudit } from "../services/auditService.js";

export const dietRouter = Router();

function serializeDietQuery<T extends { status: string }>(dietQuery: T) {
  return { ...dietQuery, status: dietStatusFromPrisma(dietQuery.status) };
}

dietRouter.get("/diet-queries", requireAuth, async (_req, res, next) => {
  try {
    const dietQueries = await prisma.dietQuery.findMany({ orderBy: { date: "desc" } });
    res.json({ success: true, data: { dietQueries: dietQueries.map(serializeDietQuery) }, error: null });
  } catch (err) {
    next(err);
  }
});

// PA-only — matches the frontend's addDiet rule: status defaults to Pending
// and date is always stamped as today.
dietRouter.post(
  "/diet-queries",
  requireAuth,
  requireRole("PA"),
  validateBody(createDietQuerySchema),
  async (req, res, next) => {
    try {
      const { query, requester, responsible, followup, remarks, resolution } = req.body;
      const dietQuery = await prisma.dietQuery.create({
        data: {
          query, requester, responsible, remarks, resolution,
          date: todayDateOnly(),
          followup: toDateOnly(followup),
        },
      });
      await logAudit(req.user!.name, `Logged diet query ${dietQuery.id}`);
      res.status(201).json({ success: true, data: { dietQuery: serializeDietQuery(dietQuery) }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// PA-only — matches the frontend's updateDietStatus rule exactly: a
// Completed status stamps a resolution (falling back to "Resolved" when
// none is on record), any other status leaves resolution untouched unless
// the body explicitly supplied a new one.
dietRouter.patch(
  "/diet-queries/:id/status",
  requireAuth,
  requireRole("PA"),
  validateBody(updateDietStatusSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, resolution } = req.body;
      const existing = await prisma.dietQuery.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Diet query not found.");

      const nextResolution =
        status === "Completed" ? (resolution !== undefined ? resolution : existing.resolution) || "Resolved" : resolution !== undefined ? resolution : existing.resolution;

      const dietQuery = await prisma.dietQuery.update({
        where: { id },
        data: { status: dietStatusToPrisma(status) as DietStatus, resolution: nextResolution },
      });
      await logAudit(req.user!.name, `Diet query ${id} set to ${status}`);
      res.json({ success: true, data: { dietQuery: serializeDietQuery(dietQuery) }, error: null });
    } catch (err) {
      next(err);
    }
  }
);
