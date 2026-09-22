/**
 * Appointment status-transition matrix — the single source of truth for
 * which quick actions (approve/reject/postpone/mark-completed) are valid
 * from which current state, and who can trigger them. Mirrored on the
 * frontend (app/src/lib/appointmentStatus.ts) so the UI only ever offers
 * actions the API will actually accept; kept in one file on each side
 * (rather than shared across the two separate npm projects) but the two
 * must be changed together.
 *
 * "Completed" and "Cancelled" are terminal — no quick action leaves them.
 * The only way out of a terminal state, or into an otherwise-unreachable
 * transition, is the PA's explicit Edit override (routes/appointments.ts
 * PATCH /appointments/:id), which is intentionally not bound by this
 * matrix — that's its whole purpose.
 */
export type AppointmentApproval = "Pending" | "Approved" | "Rejected" | "Postponed" | "Completed" | "Cancelled";
export type QuickActionStatus = "Approved" | "Rejected" | "Postponed" | "Completed";

const TRANSITIONS: Record<AppointmentApproval, Partial<Record<QuickActionStatus, Array<"CEO" | "PA">>>> = {
  Pending: { Approved: ["CEO"], Rejected: ["CEO"], Postponed: ["CEO", "PA"] },
  Postponed: { Approved: ["CEO"], Rejected: ["CEO"] },
  Approved: { Postponed: ["CEO", "PA"], Completed: ["PA"] },
  Rejected: {},
  Completed: {},
  Cancelled: {},
};

export function canQuickTransition(from: AppointmentApproval, to: QuickActionStatus, role: "CEO" | "PA"): boolean {
  return !!TRANSITIONS[from]?.[to]?.includes(role);
}

/** Rescheduling (a date/time change, not a status value) is allowed from
 * any non-terminal state. */
export function canReschedule(from: AppointmentApproval): boolean {
  return !["Rejected", "Completed", "Cancelled"].includes(from);
}
