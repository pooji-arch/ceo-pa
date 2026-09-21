import { Router } from "express";
import type { KaizenApproval, KaizenStatus, YesNoNA } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { toDateOnly } from "../utils/date.js";
import {
  kaizenApprovalFromPrisma,
  kaizenApprovalToPrisma,
  kaizenStatusFromPrisma,
  kaizenStatusToPrisma,
  yesNoFromPrisma,
  yesNoToPrisma,
} from "../utils/enumMap.js";
import {
  createKaizenSchema,
  updateKaizenApprovalSchema,
  updateKaizenDetailsSchema,
  updateKaizenProgressSchema,
  updateKaizenStatusSchema,
} from "../validation/kaizenSchemas.js";
import { addExecutedBySchema } from "../validation/executedBySchemas.js";
import { logAudit } from "../services/auditService.js";

export const kaizenRouter = Router();

function serializeKaizen<T extends { status: string; approval: string; yesNo: string; addToEffort: string }>(
  idea: T
) {
  return {
    ...idea,
    status: kaizenStatusFromPrisma(idea.status),
    approval: kaizenApprovalFromPrisma(idea.approval),
    yesNo: yesNoFromPrisma(idea.yesNo),
    addToEffort: yesNoFromPrisma(idea.addToEffort),
  };
}

// Includes contributors — the frontend's KaizenIdea type carries its own
// contributor ledger (see KaizenIndividual.tsx), not a separate fetch.
kaizenRouter.get("/kaizen-ideas", requireAuth, async (_req, res, next) => {
  try {
    const kaizenIdeas = await prisma.kaizenIdea.findMany({ orderBy: { date: "desc" }, include: { contributors: true } });
    res.json({ success: true, data: { kaizenIdeas: kaizenIdeas.map(serializeKaizen) }, error: null });
  } catch (err) {
    next(err);
  }
});

kaizenRouter.get("/kaizen-ideas/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const kaizenIdea = await prisma.kaizenIdea.findUnique({ where: { id }, include: { contributors: true } });
    if (!kaizenIdea) throw new AppError(404, "NOT_FOUND", "Kaizen idea not found.");
    res.json({ success: true, data: { kaizenIdea: serializeKaizen(kaizenIdea) }, error: null });
  } catch (err) {
    next(err);
  }
});

// PA-only — matches the frontend's addKaizen rule: the client sends only a
// department name, the server resolves it against the fixed Department table
// and derives deptCode (never trusting a client-supplied code), and every
// other field is seeded with the exact same defaults addKaizen uses.
kaizenRouter.post(
  "/kaizen-ideas",
  requireAuth,
  requireRole("PA"),
  validateBody(createKaizenSchema),
  async (req, res, next) => {
    try {
      const { dept, title, champion, date, status } = req.body;
      const department = await prisma.department.findUnique({ where: { name: dept } });
      if (!department) throw new AppError(400, "UNKNOWN_DEPARTMENT", `${dept} is not a recognized department.`);

      const kaizenIdea = await prisma.kaizenIdea.create({
        data: {
          dept: department.name,
          deptCode: department.code,
          date: toDateOnly(date),
          title,
          champion,
          executedBy: [],
          impactDept: "",
          approval: "Hold" as KaizenApproval,
          status: kaizenStatusToPrisma(status) as KaizenStatus,
          projectEndDate: null,
          impact: "",
          impactTimeline: "",
          impactResult: "-",
          completionMonth: "-",
          scoringStatus: "-",
          impactStudy: "",
          yesNo: yesNoToPrisma("-") as YesNoNA,
          addToEffort: yesNoToPrisma("-") as YesNoNA,
          resultDocLink: "",
          progress: status === "Completed" ? 100 : 5,
        },
        include: { contributors: true },
      });
      await logAudit(req.user!.name, `Created Kaizen idea ${kaizenIdea.id} (${title})`);
      res.status(201).json({ success: true, data: { kaizenIdea: serializeKaizen(kaizenIdea) }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// PA-only — matches the frontend's updateKaizenStatus rule: a status of
// Completed also snaps progress to 100, otherwise progress is untouched.
kaizenRouter.patch(
  "/kaizen-ideas/:id/status",
  requireAuth,
  requireRole("PA"),
  validateBody(updateKaizenStatusSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const existing = await prisma.kaizenIdea.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Kaizen idea not found.");
      const kaizenIdea = await prisma.kaizenIdea.update({
        where: { id },
        data: {
          status: kaizenStatusToPrisma(status) as KaizenStatus,
          progress: status === "Completed" ? 100 : existing.progress,
        },
        include: { contributors: true },
      });
      await logAudit(req.user!.name, `Kaizen idea ${id} (${existing.title}) set to ${status}`);
      res.json({ success: true, data: { kaizenIdea: serializeKaizen(kaizenIdea) }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// PA-only — matches the frontend's updateKaizenApproval rule: just updates
// approval, nothing else.
kaizenRouter.patch(
  "/kaizen-ideas/:id/approval",
  requireAuth,
  requireRole("PA"),
  validateBody(updateKaizenApprovalSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { approval } = req.body;
      const existing = await prisma.kaizenIdea.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Kaizen idea not found.");
      const kaizenIdea = await prisma.kaizenIdea.update({
        where: { id },
        data: { approval: kaizenApprovalToPrisma(approval) as KaizenApproval },
        include: { contributors: true },
      });
      await logAudit(req.user!.name, `Kaizen idea ${id} (${existing.title}) approval set to ${approval}`);
      res.json({ success: true, data: { kaizenIdea: serializeKaizen(kaizenIdea) }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// PA-only — matches the frontend's updateKaizenProgress rule: clamps to
// 0-100, and hitting exactly 100 also snaps status to Completed.
kaizenRouter.patch(
  "/kaizen-ideas/:id/progress",
  requireAuth,
  requireRole("PA"),
  validateBody(updateKaizenProgressSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { progress } = req.body;
      const existing = await prisma.kaizenIdea.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Kaizen idea not found.");
      const clamped = Math.max(0, Math.min(100, progress || 0));
      const kaizenIdea = await prisma.kaizenIdea.update({
        where: { id },
        data: {
          progress: clamped,
          status: clamped === 100 ? ("Completed" as KaizenStatus) : existing.status,
        },
        include: { contributors: true },
      });
      res.json({ success: true, data: { kaizenIdea: serializeKaizen(kaizenIdea) }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// PA-only — matches the frontend's updateKaizenDetails rule: a generic
// partial-field patch, restricted to the fields that don't have their own
// dedicated route above.
kaizenRouter.patch(
  "/kaizen-ideas/:id",
  requireAuth,
  requireRole("PA"),
  validateBody(updateKaizenDetailsSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const existing = await prisma.kaizenIdea.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Kaizen idea not found.");

      const { projectEndDate, yesNo, addToEffort, ...rest } = req.body;
      const kaizenIdea = await prisma.kaizenIdea.update({
        where: { id },
        data: {
          ...rest,
          ...(projectEndDate !== undefined
            ? { projectEndDate: projectEndDate ? toDateOnly(projectEndDate) : null }
            : {}),
          ...(yesNo !== undefined ? { yesNo: yesNoToPrisma(yesNo) as YesNoNA } : {}),
          ...(addToEffort !== undefined ? { addToEffort: yesNoToPrisma(addToEffort) as YesNoNA } : {}),
        },
        include: { contributors: true },
      });
      res.json({ success: true, data: { kaizenIdea: serializeKaizen(kaizenIdea) }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// PA-only — atomic add, avoiding the read-whole-array-then-replace race a
// bulk PATCH would have under concurrent edits.
kaizenRouter.post(
  "/kaizen-ideas/:id/executed-by",
  requireAuth,
  requireRole("PA"),
  validateBody(addExecutedBySchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const existing = await prisma.kaizenIdea.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Kaizen idea not found.");
      const kaizenIdea = await prisma.kaizenIdea.update({
        where: { id },
        data: { executedBy: { push: name } },
        include: { contributors: true },
      });
      res.status(201).json({ success: true, data: { kaizenIdea: serializeKaizen(kaizenIdea) }, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// PA-only — atomic remove (Prisma has no "remove by value" on a scalar list,
// so this reads the array, filters, and writes it back in one request).
kaizenRouter.delete(
  "/kaizen-ideas/:id/executed-by/:name",
  requireAuth,
  requireRole("PA"),
  async (req, res, next) => {
    try {
      const { id, name } = req.params;
      const existing = await prisma.kaizenIdea.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Kaizen idea not found.");
      const executedBy = existing.executedBy.filter((n) => n !== name);
      const kaizenIdea = await prisma.kaizenIdea.update({ where: { id }, data: { executedBy }, include: { contributors: true } });
      res.json({ success: true, data: { kaizenIdea: serializeKaizen(kaizenIdea) }, error: null });
    } catch (err) {
      next(err);
    }
  }
);
