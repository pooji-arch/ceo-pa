import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { toDateOnly, todayDateOnly } from "../utils/date.js";
import { notify } from "../services/notifyService.js";
import { logAudit } from "../services/auditService.js";
import {
  approvalActionSchema,
  createAppointmentSchema,
  rescheduleSchema,
  unplannedVisitorSchema,
} from "../validation/appointmentSchemas.js";

export const appointmentsRouter = Router();

appointmentsRouter.get("/appointments", requireAuth, async (_req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({ orderBy: { date: "asc" } });
    res.json({ success: true, data: { appointments }, error: null });
  } catch (err) {
    next(err);
  }
});

// PA-only — matches the frontend's addAppointment rule: meeting link status
// follows from the chosen approval status at creation time.
appointmentsRouter.post(
  "/appointments",
  requireAuth,
  requireRole("PA"),
  validateBody(createAppointmentSchema),
  async (req, res, next) => {
    try {
      const { requester, dept, purpose, date, time, priority, approval } = req.body;
      const meeting = approval === "Approved" ? "Scheduled" : "Pending";
      const appointment = await prisma.appointment.create({
        data: { requester, dept, purpose, date: toDateOnly(date), time, priority, approval, meeting },
      });
      if (approval === "Pending") {
        await notify("📅", `New appointment request from ${requester} (${dept}) awaiting your approval.`);
      }
      await logAudit(req.user!.name, `Created appointment request ${appointment.id} (${requester})`);
      res.status(201).json({ success: true, data: { appointment }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// CEO-only — matches the frontend's apptAction rule exactly:
// Approved -> meeting Scheduled, Rejected -> Cancelled, Postponed -> Pending.
appointmentsRouter.patch(
  "/appointments/:id/approval",
  requireAuth,
  requireRole("CEO"),
  validateBody(approvalActionSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const existing = await prisma.appointment.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Appointment not found.");
      const meeting = status === "Approved" ? "Scheduled" : status === "Rejected" ? "Cancelled" : "Pending";
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { approval: status, meeting, reason: reason ?? existing.reason },
      });
      const statusIcon = status === "Approved" ? "✅" : status === "Rejected" ? "❌" : "⏸️";
      await notify(statusIcon, `Appointment with ${existing.requester} marked ${status}.`);
      await logAudit(req.user!.name, `Marked appointment ${id} (${existing.requester}) as ${status}${reason ? " — " + reason : ""}`);
      res.json({ success: true, data: { appointment }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// PA-only — matches the frontend's rescheduleAppt rule: resets approval and
// meeting back to Pending, and stamps a standard reason.
appointmentsRouter.patch(
  "/appointments/:id/reschedule",
  requireAuth,
  requireRole("PA"),
  validateBody(rescheduleSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { date, time } = req.body;
      const existing = await prisma.appointment.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Appointment not found.");
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { date: toDateOnly(date), time, approval: "Pending", meeting: "Pending", reason: "Rescheduled by PA" },
      });
      await logAudit(req.user!.name, `Rescheduled appointment ${id} (${existing.requester}) to ${date} ${time}`);
      res.json({ success: true, data: { appointment }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

appointmentsRouter.get("/visitor-history", requireAuth, async (_req, res, next) => {
  try {
    const visitorHistory = await prisma.visitorHistoryEntry.findMany({ orderBy: { date: "desc" } });
    res.json({ success: true, data: { visitorHistory }, error: null });
  } catch (err) {
    next(err);
  }
});

// PA-only — matches the frontend's addUnplanned rule: also appends a
// visitor-history row so the decision shows up in the history table.
appointmentsRouter.post(
  "/unplanned-visitors",
  requireAuth,
  requireRole("PA"),
  validateBody(unplannedVisitorSchema),
  async (req, res, next) => {
    try {
      const { name, purpose, decision, remarks } = req.body;
      const [unplannedVisitor, visitorHistoryEntry] = await prisma.$transaction([
        prisma.unplannedVisitor.create({ data: { name, purpose, decision, remarks } }),
        prisma.visitorHistoryEntry.create({
          data: { name, date: todayDateOnly(), purpose: purpose || "Unplanned visit", outcome: decision },
        }),
      ]);
      await logAudit(req.user!.name, `Recorded unplanned visitor: ${name} (${decision})`);
      res.status(201).json({ success: true, data: { unplannedVisitor, visitorHistoryEntry }, error: null });
    } catch (err) {
      next(err);
    }
  }
);
