import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { todayDateOnly } from "../utils/date.js";
import { createDailyActivitySchema } from "../validation/dailyActivitySchemas.js";
import { logAudit } from "../services/auditService.js";

export const dailyActivitiesRouter = Router();

dailyActivitiesRouter.get("/daily-activities", requireAuth, async (_req, res, next) => {
  try {
    const dailyActivities = await prisma.dailyActivity.findMany({ orderBy: { date: "desc" } });
    res.json({ success: true, data: { dailyActivities }, error: null });
  } catch (err) {
    next(err);
  }
});

// PA-only — matches the frontend's addDaily rule: date is always stamped as today.
dailyActivitiesRouter.post(
  "/daily-activities",
  requireAuth,
  requireRole("PA"),
  validateBody(createDailyActivitySchema),
  async (req, res, next) => {
    try {
      const { type, desc, outcome } = req.body;
      const dailyActivity = await prisma.dailyActivity.create({
        data: { type, desc, outcome, date: todayDateOnly() },
      });
      await logAudit(req.user!.name, `Logged completed activity: ${desc}`);
      res.status(201).json({ success: true, data: { dailyActivity }, error: null });
    } catch (err) {
      next(err);
    }
  }
);
