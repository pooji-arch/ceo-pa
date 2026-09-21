// The frontend's wire format uses the exact display strings from
// app/src/store/types.ts (e.g. "In Progress"), while Prisma Client's JS API
// always uses the schema's own identifier (e.g. InProgress) regardless of
// @map — these bridge the two so the API's JSON shape needs no change when
// the frontend switches from mock data to live calls.

const TASK_STATUS_TO_PRISMA: Record<string, string> = { "In Progress": "InProgress" };
const TASK_STATUS_FROM_PRISMA: Record<string, string> = { InProgress: "In Progress" };

export function taskStatusToPrisma(status: string): string {
  return TASK_STATUS_TO_PRISMA[status] ?? status;
}
export function taskStatusFromPrisma(status: string): string {
  return TASK_STATUS_FROM_PRISMA[status] ?? status;
}

const ACTION_POINT_STATUS_TO_PRISMA: Record<string, string> = { "In Progress": "InProgress" };
const ACTION_POINT_STATUS_FROM_PRISMA: Record<string, string> = { InProgress: "In Progress" };

export function actionPointStatusToPrisma(status: string): string {
  return ACTION_POINT_STATUS_TO_PRISMA[status] ?? status;
}
export function actionPointStatusFromPrisma(status: string): string {
  return ACTION_POINT_STATUS_FROM_PRISMA[status] ?? status;
}

const KAIZEN_STATUS_TO_PRISMA: Record<string, string> = { "Under Process": "UnderProcess" };
const KAIZEN_STATUS_FROM_PRISMA: Record<string, string> = { UnderProcess: "Under Process" };

export function kaizenStatusToPrisma(status: string): string {
  return KAIZEN_STATUS_TO_PRISMA[status] ?? status;
}
export function kaizenStatusFromPrisma(status: string): string {
  return KAIZEN_STATUS_FROM_PRISMA[status] ?? status;
}

const KAIZEN_APPROVAL_TO_PRISMA: Record<string, string> = {
  "Not Approved": "NotApproved",
  "Already in Plan": "AlreadyInPlan",
  "Already there": "AlreadyThere",
  "Given idea": "GivenIdea",
  "Check with CEO/DR": "CheckWithCeoDr",
};
const KAIZEN_APPROVAL_FROM_PRISMA: Record<string, string> = {
  NotApproved: "Not Approved",
  AlreadyInPlan: "Already in Plan",
  AlreadyThere: "Already there",
  GivenIdea: "Given idea",
  CheckWithCeoDr: "Check with CEO/DR",
};

export function kaizenApprovalToPrisma(approval: string): string {
  return KAIZEN_APPROVAL_TO_PRISMA[approval] ?? approval;
}
export function kaizenApprovalFromPrisma(approval: string): string {
  return KAIZEN_APPROVAL_FROM_PRISMA[approval] ?? approval;
}

const YES_NO_TO_PRISMA: Record<string, string> = { "-": "Unset" };
const YES_NO_FROM_PRISMA: Record<string, string> = { Unset: "-" };

export function yesNoToPrisma(value: string): string {
  return YES_NO_TO_PRISMA[value] ?? value;
}
export function yesNoFromPrisma(value: string): string {
  return YES_NO_FROM_PRISMA[value] ?? value;
}

const DIET_STATUS_TO_PRISMA: Record<string, string> = { "In Progress": "InProgress" };
const DIET_STATUS_FROM_PRISMA: Record<string, string> = { InProgress: "In Progress" };

export function dietStatusToPrisma(status: string): string {
  return DIET_STATUS_TO_PRISMA[status] ?? status;
}
export function dietStatusFromPrisma(status: string): string {
  return DIET_STATUS_FROM_PRISMA[status] ?? status;
}

const MILESTONE_STATUS_TO_PRISMA: Record<string, string> = {
  "On-time Completion": "OnTimeCompletion",
  "Overdue Completion": "OverdueCompletion",
};
const MILESTONE_STATUS_FROM_PRISMA: Record<string, string> = {
  OnTimeCompletion: "On-time Completion",
  OverdueCompletion: "Overdue Completion",
};

export function milestoneStatusToPrisma(status: string): string {
  return MILESTONE_STATUS_TO_PRISMA[status] ?? status;
}
export function milestoneStatusFromPrisma(status: string): string {
  return MILESTONE_STATUS_FROM_PRISMA[status] ?? status;
}
