import { z } from "zod";
export const createIpRuleSchema = z.object({
    type: z.enum(["BLOCK", "WHITELIST"]),
    ipCidr: z.string().min(3).max(64),
    description: z.string().max(200).optional(),
    reason: z.string().max(200).optional(),
});
export const deleteIpRuleSchema = z.object({
    id: z.string().uuid(),
});
