import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { toDateOnly } from "../utils/date.js";
import { buildMonthWeeks, computeWeekTotals } from "../utils/weeklyScore.js";
import { updateWeeklyScoreDaySchema } from "../validation/weeklyScoreSchemas.js";
import { logAudit } from "../services/auditService.js";

export const weeklyScoresRouter = Router();

// cuid ids are lexicographically time-sortable, and every week is created in
// chronological order (seeded, or appended via /next-month) — so ordering by
// id doubles as chronological order without needing a dedicated column.
weeklyScoresRouter.get("/weekly-scores", requireAuth, async (_req, res, next) => {
  try {
    const weeklyScores = await prisma.weeklyScore.findMany({
      orderBy: { id: "asc" },
      include: { days: { orderBy: { date: "asc" } } },
    });
    const withTotals = weeklyScores.map((week) => ({ ...week, totals: computeWeekTotals(week.days) }));
    res.json({ success: true, data: { weeklyScores: withTotals }, error: null });
  } catch (err) {
    next(err);
  }
});

// PA-only — matches the frontend's updateWeeklyScoreDay rule: hours clamped
// to 0-16, notes free text; only the fields actually sent are changed.
weeklyScoresRouter.patch(
  "/weekly-scores/:weekId/days/:date",
  requireAuth,
  requireRole("PA"),
  validateBody(updateWeeklyScoreDaySchema),
  async (req, res, next) => {
    try {
      const { weekId, date } = req.params;
      const { hours, notes } = req.body;
      const key = { weeklyScoreId_date: { weeklyScoreId: weekId, date: toDateOnly(date) } };
      const existing = await prisma.dayWork.findUnique({ where: key, include: { weeklyScore: { select: { weekLabel: true } } } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Day not found in this week.");
      const clampedHours = hours !== undefined ? Math.max(0, Math.min(16, hours)) : existing.hours;
      const dayWork = await prisma.dayWork.update({
        where: key,
        data: {
          hours: clampedHours,
          notes: notes !== undefined ? notes : existing.notes,
        },
      });
      await logAudit(req.user!.name, `Updated ${existing.weeklyScore.weekLabel} — ${existing.label} (${date}): ${clampedHours}h logged`);
      res.json({ success: true, data: { dayWork }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// PA-only — matches the frontend's "Add Next Month" rule (handleAddNextMonth
// in Scoring.tsx): finds the last tracked day across all weeks, generates the
// following calendar month's Mon-Sat week blocks with the same algorithm the
// frontend uses, and creates them all in one transaction.
weeklyScoresRouter.post("/weekly-scores/next-month", requireAuth, requireRole("PA"), async (req, res, next) => {
  try {
    const lastWeek = await prisma.weeklyScore.findFirst({
      orderBy: { id: "desc" },
      include: { days: { orderBy: { date: "desc" }, take: 1 } },
    });
    const lastDay = lastWeek?.days[0];
    if (!lastDay) {
      throw new AppError(400, "NO_EXISTING_WEEKS", "No existing weekly scoring data to continue from.");
    }
    const nextYear = lastDay.date.getUTCFullYear();
    const nextMonthIndex = lastDay.date.getUTCMonth() + 1;
    const generated = buildMonthWeeks(nextYear, nextMonthIndex);

    const created = await prisma.$transaction(
      generated.map((week) =>
        prisma.weeklyScore.create({
          data: {
            monthLabel: week.monthLabel,
            weekLabel: week.weekLabel,
            rangeLabel: week.rangeLabel,
            days: { create: week.days.map((d) => ({ date: toDateOnly(d.date), label: d.label, hours: d.hours, notes: d.notes })) },
          },
          include: { days: { orderBy: { date: "asc" } } },
        })
      )
    );

    await logAudit(req.user!.name, `Opened weekly scoring for ${created[0]?.monthLabel ?? "a new month"}`);
    res.status(201).json({ success: true, data: { weeklyScores: created }, error: null });
  } catch (err) {
    next(err);
  }
});
