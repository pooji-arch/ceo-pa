import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { toDateOnly } from "../utils/date.js";
import { upsertContributorSchema } from "../validation/contributorSchemas.js";

export const kaizenScoringRouter = Router();

kaizenScoringRouter.get("/kaizen-ideas/:kaizenIdeaId/contributors", requireAuth, async (req, res, next) => {
  try {
    const { kaizenIdeaId } = req.params;
    const contributors = await prisma.contributor.findMany({ where: { kaizenIdeaId } });
    res.json({ success: true, data: { contributors }, error: null });
  } catch (err) {
    next(err);
  }
});

// PA-only — matches the frontend's updateContributor rule exactly:
// contributors aren't typed in separately, so scoring one for the first
// time upserts their row (defaulting the other three scores to 0) instead
// of requiring a distinct "add contributor" step.
kaizenScoringRouter.patch(
  "/kaizen-ideas/:kaizenIdeaId/contributors/:name",
  requireAuth,
  requireRole("PA"),
  validateBody(upsertContributorSchema),
  async (req, res, next) => {
    try {
      const { kaizenIdeaId, name } = req.params;
      const idea = await prisma.kaizenIdea.findUnique({ where: { id: kaizenIdeaId } });
      if (!idea) throw new AppError(404, "NOT_FOUND", "Kaizen idea not found.");
      const { idea: ideaScore, execution, ontime, impact } = req.body;
      const contributor = await prisma.contributor.upsert({
        where: { kaizenIdeaId_name: { kaizenIdeaId, name } },
        create: {
          kaizenIdeaId, name,
          idea: ideaScore ?? 0, execution: execution ?? 0, ontime: ontime ?? 0, impact: impact ?? 0,
        },
        update: {
          ...(ideaScore !== undefined ? { idea: ideaScore } : {}),
          ...(execution !== undefined ? { execution } : {}),
          ...(ontime !== undefined ? { ontime } : {}),
          ...(impact !== undefined ? { impact } : {}),
        },
      });
      res.json({ success: true, data: { contributor }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

function contributorNames(champion: string, executedBy: string[]): string[] {
  return Array.from(new Set([champion, ...executedBy].map((n) => n.trim()).filter(Boolean)));
}

// Server-computed leaderboard — mirrors KaizenIndividual.tsx's leaderboard
// useMemo exactly: sums each person's Total Score (idea+execution+ontime+
// impact) across every idea they're credited on (as champion or in
// executedBy), skipping zero-total entries, sorted descending.
kaizenScoringRouter.get("/kaizen-leaderboard", requireAuth, async (_req, res, next) => {
  try {
    const ideas = await prisma.kaizenIdea.findMany({
      select: { champion: true, executedBy: true, contributors: true },
    });
    const totals = new Map<string, number>();
    for (const idea of ideas) {
      for (const name of contributorNames(idea.champion, idea.executedBy)) {
        const c = idea.contributors.find((x) => x.name === name);
        const total = c ? c.idea + c.execution + c.ontime + c.impact : 0;
        if (total > 0) totals.set(name, (totals.get(name) ?? 0) + total);
      }
    }
    const leaderboard = Array.from(totals.entries())
      .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);
    res.json({ success: true, data: { leaderboard }, error: null });
  } catch (err) {
    next(err);
  }
});

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Server-computed department scorecard — mirrors KaizenDeptData.tsx exactly:
// one row per department for the given month, milestones grouped by their
// parent idea's department and keyed off the milestone's End Date. MS = all
// milestones due that month, OTC/DC/NC = status breakdown, pct = OTC/MS.
kaizenScoringRouter.get("/kaizen-dept-scorecard", requireAuth, async (req, res, next) => {
  try {
    const allMilestonesWithEndDate = await prisma.milestone.findMany({
      where: { endDate: { not: null } },
      select: { endDate: true },
    });
    const availableMonths = Array.from(
      new Set(allMilestonesWithEndDate.map((m) => monthKey(m.endDate as Date)))
    ).sort();

    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    if (!month) {
      res.json({ success: true, data: { availableMonths, month: null, rows: [] }, error: null });
      return;
    }

    const [year, monthNum] = month.split("-").map(Number);
    const rangeStart = toDateOnly(`${year}-${String(monthNum).padStart(2, "0")}-01`);
    const nextMonthDate = new Date(Date.UTC(year, monthNum, 1));
    const rangeEnd = toDateOnly(
      `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, "0")}-01`
    );

    const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
    const milestonesInMonth = await prisma.milestone.findMany({
      where: { endDate: { gte: rangeStart, lt: rangeEnd } },
      include: { kaizenIdea: { select: { dept: true } } },
    });

    const rows = departments.map((dept) => {
      const deptMilestones = milestonesInMonth.filter((m) => m.kaizenIdea.dept === dept.name);
      const ms = deptMilestones.length;
      const otc = deptMilestones.filter((m) => m.status === "OnTimeCompletion").length;
      const dc = deptMilestones.filter((m) => m.status === "OverdueCompletion").length;
      const nc = deptMilestones.filter((m) => m.status === "Hold" || m.status === "NA").length;
      const pct = ms > 0 ? Math.round((otc / ms) * 100) : null;
      return { deptName: dept.name, deptCode: dept.code, ms, otc, dc, nc, pct };
    });

    res.json({ success: true, data: { availableMonths, month, rows }, error: null });
  } catch (err) {
    next(err);
  }
});
