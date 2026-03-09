import { z } from "zod";

const snakeCaseSchema = z.object({
  student_id: z.string().uuid(),
  lesson_id: z.string().uuid(),
});

const camelCaseSchema = z.object({
  studentId: z.string().uuid(),
  lessonId: z.string().uuid(),
});

export const createBookingSchema = z
  .union([snakeCaseSchema, camelCaseSchema])
  .transform((data) => ({
    student_id: "student_id" in data ? data.student_id : data.studentId,
    lesson_id: "lesson_id" in data ? data.lesson_id : data.lessonId,
  }));
