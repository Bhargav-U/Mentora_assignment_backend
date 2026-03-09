import { z } from "zod";

const snakeCaseSchema = z.object({
  lesson_id: z.string().uuid(),
  date: z.string().datetime(),
  topic: z.string().min(1),
  summary: z.string().optional(),
});

const camelCaseSchema = z.object({
  lessonId: z.string().uuid(),
  date: z.string().datetime(),
  topic: z.string().min(1),
  summary: z.string().optional(),
});

export const createSessionSchema = z
  .union([snakeCaseSchema, camelCaseSchema])
  .transform((data) => ({
    lesson_id: "lesson_id" in data ? data.lesson_id : data.lessonId,
    date: data.date,
    topic: data.topic,
    summary: data.summary,
  }));
