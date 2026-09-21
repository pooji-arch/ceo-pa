import { z } from "zod";

export const upsertContributorSchema = z.object({
  idea: z.number().optional(),
  execution: z.number().optional(),
  ontime: z.number().optional(),
  impact: z.number().optional(),
});
