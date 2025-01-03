import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  name: z.string().min(1, {
    message: "First Name must be at least 1 characters.",
  }),
});
