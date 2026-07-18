import { z } from "zod";
export const registerSchema = z.object({
    tenantName: z.string().min(2),
    companyName: z.string().min(2),
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
});
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    tenantId: z.string().uuid(),
});
