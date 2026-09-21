import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { toDateOnly } from "../utils/date.js";
import { createOtherTaskSchema } from "../validation/otherTaskSchemas.js";
import { logAudit } from "../services/auditService.js";

export const otherTasksRouter = Router();

otherTasksRouter.get("/other-tasks", requireAuth, async (_req, res, next) => {
  try {
    const otherTasks = await prisma.otherTask.findMany({ orderBy: { due: "asc" } });
    res.json({ success: true, data: { otherTasks }, error: null });
  } catch (err) {
    next(err);
  }
});

// PA-only — matches the frontend's addOther rule: every new task starts New.
// No status-update endpoint: the frontend has no UI for changing it.
otherTasksRouter.post(
  "/other-tasks",
  requireAuth,
  requireRole("PA"),
  validateBody(createOtherTaskSchema),
  async (req, res, next) => {
    try {
      const { title, owner, due } = req.body;
      const otherTask = await prisma.otherTask.create({
        data: { title, owner, due: toDateOnly(due), status: "New" },
      });
      await logAudit(req.user!.name, `Added other CEO task: ${title}`);
      res.status(201).json({ success: true, data: { otherTask }, error: null });
    } catch (err) {
      next(err);
    }
  }
);
