import { z } from "zod";

export const createSessionSchema = z.object({
  lesson_id: z.string().uuid(),
  date: z.string().datetime(),
  topic: z.string().min(1),
  summary: z.string().optional(),
});