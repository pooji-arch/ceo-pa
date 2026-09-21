import { z } from "zod";

export const createDailyActivitySchema = z.object({
  type: z.enum(["Meeting", "Task", "Follow-up", "Decision", "Important Activity"]),
  desc: z.string().min(1),
  outcome: z.string().min(1),
});
