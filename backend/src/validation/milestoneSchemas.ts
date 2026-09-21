import { z } from "zod";

export const updateMilestoneSchema = z.object({
  title: z.string().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  secondEndDate: z.string().nullable().optional(),
  completedDate: z.string().nullable().optional(),
  status: z.enum(["NA", "On-time Completion", "Overdue Completion", "Hold"]).optional(),
});
