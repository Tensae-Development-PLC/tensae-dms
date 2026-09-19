import bcrypt from "bcryptjs";
import { prisma } from "../../../config/prisma.js";
import { AppError } from "../../../common/utils/app-error.js";
import { z } from "zod";
const updateProfileSchema = z.object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().email(),
    phone: z.string().trim().max(30).optional().nullable(),
});
const updatePreferencesSchema = z.object({
    sessionTimeoutMinutes: z.number().int().min(5).max(1440),
    loginNotifications: z.boolean(),
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    documentExpiryAlerts: z.boolean(),
    workflowUpdates: z.boolean(),
    weeklyDigest: z.boolean(),
});
const updatePasswordSchema = z
    .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
})
    .refine((v) => v.currentPassword !== v.newPassword, {
    message: "New password must be different",
    path: ["newPassword"],
});
export const clientProfileController = {
    async getProfile(req, res) {
        const userId = req.requestContext?.userId;
        const tenantId = req.requestContext?.tenantId;
        if (!userId || !tenantId) {
            throw new AppError(401, "Not authenticated");
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                tenant: { include: { company: true } },
                role: true,
                profileSecurity: true,
            },
        });
        if (!user) {
            throw new AppError(404, "User not found");
        }
        res.json({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            tenantId: user.tenantId,
            tenantName: user.tenant?.name,
            companyName: user.tenant?.company?.legalName,
            roleName: user.role?.name,
            roleCode: user.role?.code,
            status: user.status,
            twoFactorEnabled: user.profileSecurity?.twoFactorEnabled ?? false,
            preferences: {
                sessionTimeoutMinutes: user.profileSecurity?.sessionTimeoutMinutes ?? 30,
                loginNotifications: user.profileSecurity?.loginNotifications ?? true,
                emailNotifications: user.profileSecurity?.emailNotifications ?? true,
                pushNotifications: user.profileSecurity?.pushNotifications ?? true,
                documentExpiryAlerts: user.profileSecurity?.documentExpiryAlerts ?? true,
                workflowUpdates: user.profileSecurity?.workflowUpdates ?? true,
                weeklyDigest: user.profileSecurity?.weeklyDigest ?? false,
            },
            createdAt: user.createdAt.toISOString(),
        });
    },
    async updateProfile(req, res) {
        const userId = req.requestContext?.userId;
        const tenantId = req.requestContext?.tenantId;
        if (!userId || !tenantId) {
            throw new AppError(401, "Not authenticated");
        }
        const dto = updateProfileSchema.parse(req.body);
        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                fullName: dto.fullName,
                email: dto.email.toLowerCase(),
                phone: dto.phone?.trim() || null,
            },
            include: {
                tenant: { include: { company: true } },
                role: true,
                profileSecurity: true,
            },
        });
        if (updated.tenantId !== tenantId) {
            throw new AppError(403, "Forbidden");
        }
        res.json({
            id: updated.id,
            fullName: updated.fullName,
            email: updated.email,
            phone: updated.phone,
            tenantName: updated.tenant?.name,
            companyName: updated.tenant?.company?.legalName,
            roleName: updated.role?.name,
            roleCode: updated.role?.code,
            status: updated.status,
            twoFactorEnabled: updated.profileSecurity?.twoFactorEnabled ?? false,
            preferences: {
                sessionTimeoutMinutes: updated.profileSecurity?.sessionTimeoutMinutes ?? 30,
                loginNotifications: updated.profileSecurity?.loginNotifications ?? true,
                emailNotifications: updated.profileSecurity?.emailNotifications ?? true,
                pushNotifications: updated.profileSecurity?.pushNotifications ?? true,
                documentExpiryAlerts: updated.profileSecurity?.documentExpiryAlerts ?? true,
                workflowUpdates: updated.profileSecurity?.workflowUpdates ?? true,
                weeklyDigest: updated.profileSecurity?.weeklyDigest ?? false,
            },
            createdAt: updated.createdAt.toISOString(),
        });
    },
    async updatePreferences(req, res) {
        const userId = req.requestContext?.userId;
        const tenantId = req.requestContext?.tenantId;
        if (!userId || !tenantId) {
            throw new AppError(401, "Not authenticated");
        }
        const dto = updatePreferencesSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.tenantId !== tenantId) {
            throw new AppError(404, "User not found");
        }
        const security = await prisma.userSecurity.upsert({
            where: { userId },
            create: {
                userId,
                sessionTimeoutMinutes: dto.sessionTimeoutMinutes,
                loginNotifications: dto.loginNotifications,
                emailNotifications: dto.emailNotifications,
                pushNotifications: dto.pushNotifications,
                documentExpiryAlerts: dto.documentExpiryAlerts,
                workflowUpdates: dto.workflowUpdates,
                weeklyDigest: dto.weeklyDigest,
            },
            update: {
                sessionTimeoutMinutes: dto.sessionTimeoutMinutes,
                loginNotifications: dto.loginNotifications,
                emailNotifications: dto.emailNotifications,
                pushNotifications: dto.pushNotifications,
                documentExpiryAlerts: dto.documentExpiryAlerts,
                workflowUpdates: dto.workflowUpdates,
                weeklyDigest: dto.weeklyDigest,
            },
        });
        res.json({
            sessionTimeoutMinutes: security.sessionTimeoutMinutes,
            loginNotifications: security.loginNotifications,
            emailNotifications: security.emailNotifications,
            pushNotifications: security.pushNotifications,
            documentExpiryAlerts: security.documentExpiryAlerts,
            workflowUpdates: security.workflowUpdates,
            weeklyDigest: security.weeklyDigest,
        });
    },
    async updatePassword(req, res) {
        const userId = req.requestContext?.userId;
        const tenantId = req.requestContext?.tenantId;
        if (!userId || !tenantId) {
            throw new AppError(401, "Not authenticated");
        }
        const dto = updatePasswordSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.tenantId !== tenantId) {
            throw new AppError(404, "User not found");
        }
        const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!valid) {
            throw new AppError(400, "Current password is incorrect");
        }
        const passwordHash = await bcrypt.hash(dto.newPassword, 10);
        await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
        res.json({ success: true });
    },
};
