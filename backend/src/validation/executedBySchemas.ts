import { z } from "zod";

export const addExecutedBySchema = z.object({
  name: z.string().min(1),
});
