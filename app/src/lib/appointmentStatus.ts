import type { ApprovalStatus, Role } from "../store/types";

/**
 * Mirrors backend/src/utils/appointmentStatus.ts exactly — the UI only
 * offers an action here if the API will actually accept it. Change both
 * together. "Completed"/"Cancelled" are terminal for quick actions; only
 * the PA's Edit override can move an appointment out of them.
 */
type QuickActionStatus = "Approved" | "Rejected" | "Postponed" | "Completed";

const TRANSITIONS: Partial<Record<ApprovalStatus, Partial<Record<QuickActionStatus, Role[]>>>> = {
  Pending: { Approved: ["CEO"], Rejected: ["CEO"], Postponed: ["CEO", "PA"] },
  Postponed: { Approved: ["CEO"], Rejected: ["CEO"] },
  Approved: { Postponed: ["CEO", "PA"], Completed: ["PA"] },
};

export function canQuickTransition(from: ApprovalStatus, to: QuickActionStatus, role: Role): boolean {
  return !!TRANSITIONS[from]?.[to]?.includes(role);
}

export function canReschedule(from: ApprovalStatus): boolean {
  return !["Rejected", "Completed", "Cancelled"].includes(from);
}

export const HISTORY_STATUSES: ApprovalStatus[] = ["Rejected", "Postponed", "Completed", "Cancelled"];
