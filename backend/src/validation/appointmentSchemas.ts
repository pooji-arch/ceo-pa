import { z } from "zod";

export const createAppointmentSchema = z.object({
  requester: z.string().min(1),
  dept: z.string().min(1),
  purpose: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  approval: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
  visitors: z.array(z.string().min(1)).default([]),
  // Set when the PA explicitly confirmed booking despite a scheduling
  // conflict the frontend detected — recorded on `reason` so that intent
  // isn't silently lost.
  force: z.boolean().optional().default(false),
});

// "Completed" is reachable here too (PA-only, see the route's transition
// check) so a one-click "Mark Completed" action doesn't need its own route.
export const approvalActionSchema = z.object({
  status: z.enum(["Approved", "Rejected", "Postponed", "Completed"]),
  reason: z.string().optional(),
});

export const rescheduleSchema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
});

// The PA's explicit override path (see routes/appointments.ts PATCH
// /appointments/:id) — every field optional since it's a partial edit, but
// `purpose` still can't be sent empty when it IS included, and `approval`
// here deliberately allows any value (including otherwise-unreachable
// transitions) since this is the sanctioned manual-correction flow.
export const editAppointmentSchema = z.object({
  requester: z.string().min(1).optional(),
  dept: z.string().min(1).optional(),
  purpose: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  time: z.string().min(1).optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  visitors: z.array(z.string().min(1)).optional(),
  approval: z.enum(["Pending", "Approved", "Rejected", "Postponed", "Completed", "Cancelled"]).optional(),
});

export const unplannedVisitorSchema = z.object({
  name: z.string().min(1),
  purpose: z.string().default(""),
  decision: z.string().min(1),
  remarks: z.string().default(""),
  date: z.string().min(1),
  time: z.string().min(1),
});
