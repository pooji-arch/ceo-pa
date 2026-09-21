import { z } from "zod";

export const createKaizenSchema = z.object({
  dept: z.string().min(1),
  title: z.string().min(1),
  champion: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(["New", "Under Process", "Hold", "Completed"]).default("New"),
});

export const updateKaizenStatusSchema = z.object({
  status: z.enum(["New", "Under Process", "Hold", "Completed"]),
});

export const updateKaizenApprovalSchema = z.object({
  approval: z.enum([
    "Hold",
    "Approved",
    "Not Approved",
    "Already in Plan",
    "Already there",
    "NSI",
    "Given idea",
    "Check with CEO/DR",
  ]),
});

export const updateKaizenProgressSchema = z.object({
  progress: z.number(),
});

export const updateKaizenDetailsSchema = z.object({
  champion: z.string().min(1).optional(),
  executedBy: z.array(z.string()).optional(),
  impactDept: z.string().optional(),
  projectEndDate: z.string().nullable().optional(),
  impact: z.string().optional(),
  impactTimeline: z.string().optional(),
  impactResult: z.string().optional(),
  completionMonth: z.string().optional(),
  scoringStatus: z.string().optional(),
  impactStudy: z.string().optional(),
  yesNo: z.enum(["-", "Yes", "No", "NA"]).optional(),
  addToEffort: z.enum(["-", "Yes", "No", "NA"]).optional(),
  resultDocLink: z.string().optional(),
});
