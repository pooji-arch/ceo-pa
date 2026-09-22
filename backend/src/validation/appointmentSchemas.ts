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

export const approvalActionSchema = z.object({
  status: z.enum(["Approved", "Rejected", "Postponed"]),
  reason: z.string().optional(),
});

export const rescheduleSchema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
});

export const unplannedVisitorSchema = z.object({
  name: z.string().min(1),
  purpose: z.string().default(""),
  decision: z.string().min(1),
  remarks: z.string().default(""),
});
