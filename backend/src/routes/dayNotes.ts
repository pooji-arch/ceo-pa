import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { toDateOnly } from "../utils/date.js";
import { addDayActualSchema, setDayPlannedSchema } from "../validation/dayNoteSchemas.js";
import { logAudit } from "../services/auditService.js";

export const dayNotesRouter = Router();

// Every note that has ever been saved — feeds the Weekly Schedule calendar,
// which renders planned/actual pills across every visible day at once (the
// per-date GET below only covers the quick-add modal's single selected day).
dayNotesRouter.get("/day-notes", requireAuth, async (_req, res, next) => {
  try {
    const dayNotes = await prisma.dayNote.findMany({ orderBy: { date: "asc" } });
    res.json({ success: true, data: { dayNotes }, error: null });
  } catch (err) {
    next(err);
  }
});

// Any authenticated user can read — the frontend always wants a note object
// to render, even before anything has been saved for that day, so a missing
// row is not a 404: it falls back to the same default shape the mock
// store's dayNotes[date] being undefined resolves to via optional chaining.
dayNotesRouter.get("/day-notes/:date", requireAuth, async (req, res, next) => {
  try {
    const { date } = req.params;
    const dayNote = await prisma.dayNote.findUnique({ where: { date: toDateOnly(date) } });
    res.json({ success: true, data: { dayNote: dayNote ?? { date, planned: "", actuals: [] } }, error: null });
  } catch (err) {
    next(err);
  }
});

// PA-only — matches the frontend's setDayPlanned rule: upsert the note for
// that date, setting planned; a brand-new row starts with actuals: [].
dayNotesRouter.put(
  "/day-notes/:date/planned",
  requireAuth,
  requireRole("PA"),
  validateBody(setDayPlannedSchema),
  async (req, res, next) => {
    try {
      const { date } = req.params;
      const { planned } = req.body;
      const dayNote = await prisma.dayNote.upsert({
        where: { date: toDateOnly(date) },
        create: { date: toDateOnly(date), planned, actuals: [] },
        update: { planned },
      });
      await logAudit(req.user!.name, `Set planned note for ${date}`);
      res.json({ success: true, data: { dayNote }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// PA-only — matches the frontend's addDayActual rule: upsert the note for
// that date, appending text to actuals; a brand-new row starts with
// planned: "" and actuals: [text].
dayNotesRouter.post(
  "/day-notes/:date/actuals",
  requireAuth,
  requireRole("PA"),
  validateBody(addDayActualSchema),
  async (req, res, next) => {
    try {
      const { date } = req.params;
      const { text } = req.body;
      const dayNote = await prisma.dayNote.upsert({
        where: { date: toDateOnly(date) },
        create: { date: toDateOnly(date), planned: "", actuals: [text] },
        update: { actuals: { push: text } },
      });
      await logAudit(req.user!.name, `Logged what actually happened on ${date}: ${text}`);
      res.status(201).json({ success: true, data: { dayNote }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// PA-only — matches the frontend's removeDayActual rule: splice actuals[index]
// out of that date's note. Unlike the frontend (a silent no-op), the API has
// no row to fall back to silently, so a missing date 404s instead.
dayNotesRouter.delete(
  "/day-notes/:date/actuals/:index",
  requireAuth,
  requireRole("PA"),
  async (req, res, next) => {
    try {
      const { date, index } = req.params;
      const existing = await prisma.dayNote.findUnique({ where: { date: toDateOnly(date) } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "No note found for this date.");
      const idx = Number(index);
      const actuals = existing.actuals.filter((_, i) => i !== idx);
      const dayNote = await prisma.dayNote.update({
        where: { date: toDateOnly(date) },
        data: { actuals },
      });
      res.json({ success: true, data: { dayNote }, error: null });
    } catch (err) {
      next(err);
    }
  }
);
