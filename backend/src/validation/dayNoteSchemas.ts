import { z } from "zod";

export const setDayPlannedSchema = z.object({
  planned: z.string(),
});

export const addDayActualSchema = z.object({
  text: z.string().min(1),
});
