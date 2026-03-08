import { z } from "zod";

export const signupSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["PARENT", "MENTOR"]),
  username: z.string().min(3),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});