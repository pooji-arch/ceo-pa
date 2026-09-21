import { z } from "zod";

export const createOtherTaskSchema = z.object({
  title: z.string().min(1),
  owner: z.string().min(1),
  due: z.string().min(1),
});
