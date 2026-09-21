import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { toDateOnly } from "../utils/date.js";
import { actionPointStatusFromPrisma } from "../utils/enumMap.js";
import { createActionPointSchema, createMeetingSchema } from "../validation/meetingSchemas.js";
import { logAudit } from "../services/auditService.js";

export const meetingsRouter = Router();

meetingsRouter.get("/meetings", requireAuth, async (_req, res, next) => {
  try {
    const meetings = await prisma.meeting.findMany({ orderBy: { date: "asc" } });
    res.json({ success: true, data: { meetings }, error: null });
  } catch (err) {
    next(err);
  }
});

// PA-only — matches the frontend's addMeeting rule: every new meeting starts Scheduled.
meetingsRouter.post("/meetings", requireAuth, requireRole("PA"), validateBody(createMeetingSchema), async (req, res, next) => {
  try {
    const { purpose, participants, date, time, agenda } = req.body;
    const meeting = await prisma.meeting.create({
      data: { purpose, participants, date: toDateOnly(date), time, agenda, status: "Scheduled" },
    });
    await logAudit(req.user!.name, `Scheduled meeting ${meeting.id} (${purpose})`);
    res.status(201).json({ success: true, data: { meeting }, error: null });
  } catch (err) {
    next(err);
  }
});

meetingsRouter.get("/action-points", requireAuth, async (_req, res, next) => {
  try {
    const actionPoints = await prisma.actionPoint.findMany({
      orderBy: { due: "asc" },
      include: { meeting: { select: { id: true, purpose: true } } },
    });
    res.json({
      success: true,
      data: { actionPoints: actionPoints.map((p) => ({ ...p, status: actionPointStatusFromPrisma(p.status) })) },
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

// PA-only — matches the frontend's addActionPoint rule: every new action point starts New.
meetingsRouter.post(
  "/action-points",
  requireAuth,
  requireRole("PA"),
  validateBody(createActionPointSchema),
  async (req, res, next) => {
    try {
      const { meetingId, point, owner, due } = req.body;
      const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
      if (!meeting) throw new AppError(404, "NOT_FOUND", "Meeting not found.");
      const actionPoint = await prisma.actionPoint.create({
        data: { meetingId, point, owner, due: toDateOnly(due), status: "New" },
      });
      await logAudit(req.user!.name, `Added action point on "${meeting.purpose}": ${point}`);
      res.status(201).json({ success: true, data: { actionPoint }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// PA-only — matches the frontend's convertActionPointToTask rule exactly:
// creates a new Task from the action point and leaves the action point
// itself untouched (no status change, no deletion).
meetingsRouter.post(
  "/action-points/:id/convert-to-task",
  requireAuth,
  requireRole("PA"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const actionPoint = await prisma.actionPoint.findUnique({ where: { id } });
      if (!actionPoint) throw new AppError(404, "NOT_FOUND", "Action point not found.");
      const task = await prisma.task.create({
        data: {
          title: actionPoint.point,
          owner: actionPoint.owner,
          dept: "—",
          priority: "Medium",
          status: "New",
          due: actionPoint.due,
          followup: actionPoint.due,
          remarks: "Converted from meeting action point",
        },
      });
      await logAudit(req.user!.name, `Converted action point to task: ${actionPoint.point}`);
      res.status(201).json({ success: true, data: { task }, error: null });
    } catch (err) {
      next(err);
    }
  }
);
