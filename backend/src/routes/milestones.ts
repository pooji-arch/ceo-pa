import { Router } from "express";
import type { MilestoneStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { toDateOnly } from "../utils/date.js";
import { milestoneStatusFromPrisma, milestoneStatusToPrisma } from "../utils/enumMap.js";
import { updateMilestoneSchema } from "../validation/milestoneSchemas.js";
import { logAudit } from "../services/auditService.js";

export const milestonesRouter = Router();

function serializeMilestone<T extends { status: string }>(m: T) {
  return { ...m, status: milestoneStatusFromPrisma(m.status) };
}

// All milestones across every idea — feeds the department scorecard
// aggregation (grouped by each parent idea's department, not exposed here).
milestonesRouter.get("/milestones", requireAuth, async (_req, res, next) => {
  try {
    const milestones = await prisma.milestone.findMany({ orderBy: { createdAt: "asc" } });
    res.json({ success: true, data: { milestones: milestones.map(serializeMilestone) }, error: null });
  } catch (err) {
    next(err);
  }
});

// createdAt order is the auto-numbering: the client displays position+1 as
// "Milestone N" next to each row (see prisma/schema.prisma's comment on
// Milestone.createdAt) rather than baking a number into the stored title,
// matching the frontend exactly — milestone titles stay freely editable.
milestonesRouter.get("/kaizen-ideas/:kaizenIdeaId/milestones", requireAuth, async (req, res, next) => {
  try {
    const { kaizenIdeaId } = req.params;
    const milestones = await prisma.milestone.findMany({
      where: { kaizenIdeaId },
      orderBy: { createdAt: "asc" },
    });
    res.json({ success: true, data: { milestones: milestones.map(serializeMilestone) }, error: null });
  } catch (err) {
    next(err);
  }
});

// PA-only — matches the frontend's addMilestone rule exactly: a new
// milestone starts completely blank (title: "", every date null, status NA).
milestonesRouter.post(
  "/kaizen-ideas/:kaizenIdeaId/milestones",
  requireAuth,
  requireRole("PA"),
  async (req, res, next) => {
    try {
      const { kaizenIdeaId } = req.params;
      const idea = await prisma.kaizenIdea.findUnique({ where: { id: kaizenIdeaId } });
      if (!idea) throw new AppError(404, "NOT_FOUND", "Kaizen idea not found.");
      const count = await prisma.milestone.count({ where: { kaizenIdeaId } });
      const milestone = await prisma.milestone.create({
        data: { kaizenIdeaId, title: "", startDate: null, endDate: null, secondEndDate: null, completedDate: null, status: "NA" },
      });
      await logAudit(req.user!.name, `Added Milestone ${count + 1} to ${idea.title}`);
      res.status(201).json({ success: true, data: { milestone: serializeMilestone(milestone) }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// PA-only — matches the frontend's updateMilestone rule: a generic
// partial-field patch (title, any of the four dates, or status).
milestonesRouter.patch(
  "/milestones/:id",
  requireAuth,
  requireRole("PA"),
  validateBody(updateMilestoneSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const existing = await prisma.milestone.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Milestone not found.");

      const { startDate, endDate, secondEndDate, completedDate, status, ...rest } = req.body;
      const milestone = await prisma.milestone.update({
        where: { id },
        data: {
          ...rest,
          ...(startDate !== undefined ? { startDate: startDate ? toDateOnly(startDate) : null } : {}),
          ...(endDate !== undefined ? { endDate: endDate ? toDateOnly(endDate) : null } : {}),
          ...(secondEndDate !== undefined ? { secondEndDate: secondEndDate ? toDateOnly(secondEndDate) : null } : {}),
          ...(completedDate !== undefined ? { completedDate: completedDate ? toDateOnly(completedDate) : null } : {}),
          ...(status !== undefined ? { status: milestoneStatusToPrisma(status) as MilestoneStatus } : {}),
        },
      });
      res.json({ success: true, data: { milestone: serializeMilestone(milestone) }, error: null });
    } catch (err) {
      next(err);
    }
  }
);
