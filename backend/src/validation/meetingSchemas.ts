import { z } from "zod";

export const createMeetingSchema = z.object({
  purpose: z.string().min(1),
  participants: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  agenda: z.string().default(""),
});

export const createActionPointSchema = z.object({
  meetingId: z.string().min(1),
  point: z.string().min(1),
  owner: z.string().min(1),
  due: z.string().min(1),
});
