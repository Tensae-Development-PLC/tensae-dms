import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().optional(),
});

/** Metadata-only document create is disabled — use multipart upload. Kept for type clarity if re-enabled. */
export const createDocumentSchema = z.object({
  name: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.coerce.bigint(),
  folderId: z.string().uuid().optional(),
});

export const createShareSchema = z.object({
  documentId: z.string().uuid(),
  expiresAt: z.string().datetime().optional(),
  allowDownload: z.boolean().default(true),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1),
  definition: z.string().min(2),
});

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
});

export const inviteTeamSchema = z.object({
  userId: z.string().uuid(),
});

export const inviteTeamByEmailSchema = z.object({
  email: z.string().email(),
  role: z.string().min(1),
  department: z.string().min(1).optional(),
  expiryDate: z.string().date().optional(),
});

export const updateSettingsSchema = z.object({
  timezone: z.string().min(1).optional(),
  twoFactorRequired: z.boolean().optional(),
  retentionDays: z.number().int().min(30).max(3650).optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
});

export const updateProfileSecuritySchema = z.object({
  twoFactorEnabled: z.boolean().optional(),
  twoFactorSecret: z.string().optional(),
});
