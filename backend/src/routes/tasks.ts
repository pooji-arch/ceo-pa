import { Router } from "express";
import type { TaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { toDateOnly, todayDateOnly } from "../utils/date.js";
import { taskStatusFromPrisma, taskStatusToPrisma } from "../utils/enumMap.js";
import { notify } from "../services/notifyService.js";
import { logAudit } from "../services/auditService.js";
import { createTaskSchema, updateTaskStatusSchema } from "../validation/taskSchemas.js";

export const tasksRouter = Router();

const NOT_OVERDUE_STATUSES = ["Completed", "Cancelled"];

function serializeTask<T extends { status: string; due: Date }>(task: T) {
  const status = taskStatusFromPrisma(task.status);
  const overdue = !NOT_OVERDUE_STATUSES.includes(status) && task.due.getTime() < todayDateOnly().getTime();
  return { ...task, status, overdue };
}

tasksRouter.get("/tasks", requireAuth, async (_req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({ orderBy: { due: "asc" } });
    res.json({ success: true, data: { tasks: tasks.map(serializeTask) }, error: null });
  } catch (err) {
    next(err);
  }
});

// PA-only — matches the frontend's addTask rule: every new task starts New.
tasksRouter.post("/tasks", requireAuth, requireRole("PA"), validateBody(createTaskSchema), async (req, res, next) => {
  try {
    const { title, description, owner, dept, priority, due, followup, remarks, outcome, attachment } = req.body;
    const task = await prisma.task.create({
      data: {
        title, description, owner, dept, priority, status: "New",
        due: toDateOnly(due), followup: toDateOnly(followup), remarks, outcome, attachment,
      },
    });
    await notify("📋", `New task assigned: "${title}" (Owner: ${owner}).`);
    await logAudit(req.user!.name, `Created task ${task.id} (${title})`);
    res.status(201).json({ success: true, data: { task: serializeTask(task) }, error: null });
  } catch (err) {
    next(err);
  }
});

// PA-only — matches the frontend's updateTaskStatus rule: Postponed/Cancelled
// reason gets appended to remarks, a Postponed status can carry a revised
// follow-up date, and Completed stamps completion + a default outcome if
// none was given.
tasksRouter.patch(
  "/tasks/:id/status",
  requireAuth,
  requireRole("PA"),
  validateBody(updateTaskStatusSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, reason, revisedFollowup } = req.body;
      const existing = await prisma.task.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Task not found.");

      let remarks = existing.remarks;
      let followup = existing.followup;
      let completion = existing.completion;
      let outcome = existing.outcome;

      if ((status === "Postponed" || status === "Cancelled") && reason !== undefined) {
        remarks = (remarks ? remarks + " | " : "") + `${status} reason: ${reason || "(none given)"}`;
      }
      if (status === "Postponed" && revisedFollowup) followup = toDateOnly(revisedFollowup);
      if (status === "Completed") {
        completion = todayDateOnly();
        if (!outcome) outcome = "Marked completed by PA";
      }

      const task = await prisma.task.update({
        where: { id },
        data: { status: taskStatusToPrisma(status) as TaskStatus, remarks, followup, completion, outcome },
      });
      await logAudit(req.user!.name, `Task ${id} (${existing.title}) set to ${status}`);
      res.json({ success: true, data: { task: serializeTask(task) }, error: null });
    } catch (err) {
      next(err);
    }
  }
);
