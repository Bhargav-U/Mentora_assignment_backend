import { z } from "zod";

export const createLessonSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});