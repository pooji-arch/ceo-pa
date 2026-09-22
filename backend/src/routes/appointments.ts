import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { toDateOnly } from "../utils/date.js";
import { notify } from "../services/notifyService.js";
import { logAudit } from "../services/auditService.js";
import {
  approvalActionSchema,
  createAppointmentSchema,
  editAppointmentSchema,
  rescheduleSchema,
  unplannedVisitorSchema,
} from "../validation/appointmentSchemas.js";
import { canQuickTransition, canReschedule, type AppointmentApproval } from "../utils/appointmentStatus.js";

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
      const { requester, dept, purpose, date, time, priority, approval, visitors, force } = req.body;
      const meeting = approval === "Approved" ? "Scheduled" : "Pending";
      const appointment = await prisma.appointment.create({
        data: {
          requester, dept, purpose, date: toDateOnly(date), time, priority, approval, meeting, visitors,
          reason: force ? "Booked despite a scheduling conflict (confirmed by PA)" : undefined,
        },
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

// CEO or PA, but which status each role can set is governed by the
// transition matrix (utils/appointmentStatus.ts) — e.g. only CEO can
// Approve/Reject, either role can Postpone, only PA can mark Completed
// (and only from Approved). Meeting -> Scheduled/Cancelled follows the new
// status the same way it always has; Completed leaves it untouched.
appointmentsRouter.patch(
  "/appointments/:id/approval",
  requireAuth,
  requireRole("CEO", "PA"),
  validateBody(approvalActionSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const existing = await prisma.appointment.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Appointment not found.");
      if (!canQuickTransition(existing.approval as AppointmentApproval, status, req.user!.role as "CEO" | "PA")) {
        throw new AppError(409, "INVALID_TRANSITION", `Cannot change status from ${existing.approval} to ${status}.`);
      }
      const meeting =
        status === "Approved" ? "Scheduled" : status === "Rejected" ? "Cancelled" : status === "Completed" ? existing.meeting : "Pending";
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { approval: status, meeting, reason: reason ?? existing.reason },
      });
      // A single, well-supported clock emoji for Postponed — the previous
      // "⏸️" pause symbol combines a base glyph with a variation selector,
      // which some font stacks fail to render and fall back to a "?" glyph.
      const statusIcon = status === "Approved" ? "✅" : status === "Rejected" ? "❌" : status === "Completed" ? "🏁" : "🕒";
      await notify(statusIcon, `Appointment with ${existing.requester} marked ${status}.`);
      await logAudit(req.user!.name, `Marked appointment ${id} (${existing.requester}) as ${status}${reason ? " — " + reason : ""}`);
      res.json({ success: true, data: { appointment }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// PA-only — matches the frontend's rescheduleAppt rule: resets approval and
// meeting back to Pending, and stamps a standard reason. Blocked once the
// appointment has reached a terminal state (Rejected/Completed/Cancelled).
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
      if (!canReschedule(existing.approval as AppointmentApproval)) {
        throw new AppError(409, "INVALID_TRANSITION", `Cannot reschedule an appointment that is ${existing.approval}.`);
      }
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

// PA-only — the explicit manual-override path (see PRD: the PA must be able
// to correct/finalize an appointment when the normal approve/reject flow
// doesn't cover the situation, e.g. the CEO couldn't act before the slot
// passed). Deliberately NOT constrained by the quick-action transition
// matrix — every field is a fixed, validated set (not raw DB access), and
// every change is audit-logged with the old -> new status when it changes.
appointmentsRouter.patch(
  "/appointments/:id",
  requireAuth,
  requireRole("PA"),
  validateBody(editAppointmentSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const existing = await prisma.appointment.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Appointment not found.");

      const { date, approval, ...rest } = req.body;
      const appointment = await prisma.appointment.update({
        where: { id },
        data: {
          ...rest,
          ...(date !== undefined ? { date: toDateOnly(date) } : {}),
          ...(approval !== undefined
            ? {
                approval,
                meeting:
                  approval === "Approved" ? "Scheduled" : approval === "Rejected" || approval === "Cancelled" ? "Cancelled" : existing.meeting,
              }
            : {}),
        },
      });

      if (approval !== undefined && approval !== existing.approval) {
        await logAudit(req.user!.name, `Edited appointment ${id} (${existing.requester}): status ${existing.approval} -> ${approval}`);
        if (approval === "Approved" || approval === "Rejected") {
          await notify(approval === "Approved" ? "✅" : "❌", `Appointment with ${existing.requester} marked ${approval} (via edit).`);
        }
      } else {
        await logAudit(req.user!.name, `Edited appointment ${id} (${existing.requester})`);
      }
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
// visitor-history row so the decision shows up in the history table. Date
// and time are now PA-entered (previously always stamped "today").
appointmentsRouter.post(
  "/unplanned-visitors",
  requireAuth,
  requireRole("PA"),
  validateBody(unplannedVisitorSchema),
  async (req, res, next) => {
    try {
      const { name, purpose, decision, remarks, date, time } = req.body;
      const [unplannedVisitor, visitorHistoryEntry] = await prisma.$transaction([
        prisma.unplannedVisitor.create({ data: { name, purpose, decision, remarks } }),
        prisma.visitorHistoryEntry.create({
          data: { name, date: toDateOnly(date), time, purpose: purpose || "Unplanned visit", outcome: decision },
        }),
      ]);
      await logAudit(req.user!.name, `Recorded unplanned visitor: ${name} (${decision})`);
      res.status(201).json({ success: true, data: { unplannedVisitor, visitorHistoryEntry }, error: null });
    } catch (err) {
      next(err);
    }
  }
);
