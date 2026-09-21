import { z } from "zod";

export const createDietQuerySchema = z.object({
  query: z.string().min(1),
  requester: z.string().min(1),
  responsible: z.string().min(1),
  followup: z.string().min(1),
  remarks: z.string().default(""),
  resolution: z.string().optional(),
});

export const updateDietStatusSchema = z.object({
  status: z.enum(["Pending", "In Progress", "Completed"]),
  resolution: z.string().optional(),
});
