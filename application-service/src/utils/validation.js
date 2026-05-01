import { z } from "zod";

const stageSchema = z.object({
  stageName: z.string().min(2),
  date: z.string().datetime().optional().or(z.literal("")),
  result: z.enum(["pending", "scheduled", "passed", "failed"]).optional()
});

export const applicationSchema = z.object({
  companyName: z.string().min(2).max(120),
  roleTitle: z.string().min(2).max(120),
  status: z.enum(["draft", "applied", "review", "interview", "accepted", "rejected"]).optional(),
  interviewStages: z.array(stageSchema).optional(),
  followUpDate: z.string().datetime().optional().or(z.literal("")),
  notes: z.string().max(5000).optional(),
  portfolioUrl: z.string().url().optional().or(z.literal(""))
});
