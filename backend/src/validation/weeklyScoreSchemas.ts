import { z } from "zod";

export const updateWeeklyScoreDaySchema = z.object({
  hours: z.number().int().optional(),
  notes: z.string().optional(),
});
