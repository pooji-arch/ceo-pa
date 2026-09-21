import type { TaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { notify } from "../services/notifyService.js";
import { todayDateOnly } from "../utils/date.js";

const NOT_OVERDUE_STATUSES: TaskStatus[] = ["Completed", "Cancelled"];

// Runs periodically (see index.ts) rather than on a single mutation, since
// "became overdue" / "came due" are time-based conditions, not user actions.
// notifiedOverdueAt / notifiedDueAt make each check idempotent — a task or
// milestone is only ever notified about once, however many times this runs.
export async function runNotificationChecks() {
  const today = todayDateOnly();

  const overdueTasks = await prisma.task.findMany({
    where: {
      due: { lt: today },
      status: { notIn: NOT_OVERDUE_STATUSES },
      notifiedOverdueAt: null,
    },
  });
  for (const task of overdueTasks) {
    await notify("⚠️", `Task "${task.title}" is now overdue.`);
    await prisma.task.update({ where: { id: task.id }, data: { notifiedOverdueAt: new Date() } });
  }

  const dueMilestones = await prisma.milestone.findMany({
    where: {
      endDate: { lte: today },
      status: "NA",
      notifiedDueAt: null,
    },
    include: { kaizenIdea: { select: { title: true } } },
  });
  for (const milestone of dueMilestones) {
    const label = milestone.title || milestone.kaizenIdea.title;
    await notify("⚡", `Kaizen milestone "${label}" is now due.`);
    await prisma.milestone.update({ where: { id: milestone.id }, data: { notifiedDueAt: new Date() } });
  }

  return { overdueTasks: overdueTasks.length, dueMilestones: dueMilestones.length };
}
