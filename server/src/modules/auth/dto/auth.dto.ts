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
  twoFactorCode: z.string().length(6).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
  tenantId: z.string().uuid(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8),
});

export const setupTwoFactorSchema = z.object({
  tenantId: z.string().uuid(),
});

export const verifyTwoFactorSchema = z.object({
  tenantId: z.string().uuid(),
  code: z.string().length(6),
});

export const recoveryCodeLoginSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  recoveryCode: z.string().min(8),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(20),
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshDto = { refreshToken: string };
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type SetupTwoFactorDto = z.infer<typeof setupTwoFactorSchema>;
export type VerifyTwoFactorDto = z.infer<typeof verifyTwoFactorSchema>;
export type RecoveryCodeLoginDto = z.infer<typeof recoveryCodeLoginSchema>;
export type AcceptInviteDto = z.infer<typeof acceptInviteSchema>;
