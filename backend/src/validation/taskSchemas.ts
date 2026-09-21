import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  owner: z.string().min(1),
  dept: z.string().min(1),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  due: z.string().min(1),
  followup: z.string().min(1),
  remarks: z.string().default(""),
  outcome: z.string().optional(),
  attachment: z.string().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["New", "In Progress", "Completed", "Postponed", "Cancelled", "Blocked"]),
  reason: z.string().optional(),
  revisedFollowup: z.string().optional(),
});
