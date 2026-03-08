import { z } from "zod";

export const createStudentSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  username: z.string().min(3),
  password: z.string().min(6),
});