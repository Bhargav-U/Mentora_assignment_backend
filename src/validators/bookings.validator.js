import { z } from "zod";

export const createBookingSchema = z.object({
  student_id: z.string().uuid(),
  lesson_id: z.string().uuid(),
});