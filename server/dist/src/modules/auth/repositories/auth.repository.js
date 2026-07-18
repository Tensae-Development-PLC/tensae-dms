import { prisma } from "../../../config/prisma.js";
export const authRepository = {
    listTenantsForEmail(email) {
        return prisma.user.findMany({
            where: { email, isActive: true },
            select: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        company: { select: { legalName: true } },
                    },
                },
            },
            distinct: ["tenantId"],
        });
    },
    findUserByEmailWithinTenant(email, tenantId) {
        return prisma.user.findFirst({
            where: { email, tenantId, isActive: true },
            include: { role: true, profileSecurity: true },
        });
    },
    findUserById(userId) {
        return prisma.user.findUnique({ where: { id: userId }, include: { role: true, profileSecurity: true } });
    },
    createRefreshToken(userId, tokenHash, expiresAt) {
        return prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
    },
    findValidRefreshToken(tokenHash) {
        return prisma.refreshToken.findFirst({
            where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
            include: { user: { include: { role: true } } },
        });
    },
    revokeRefreshToken(tokenHash) {
        return prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    },
    createPasswordResetToken(userId, tokenHash, expiresAt) {
        return prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
    },
    findValidPasswordResetToken(tokenHash) {
        return prisma.passwordResetToken.findFirst({
            where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
            include: { user: true },
        });
    },
    markPasswordResetTokenUsed(id) {
        return prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
    },
    updateUserPassword(userId, passwordHash) {
        return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    },
    getTenantSettings(tenantId) {
        return prisma.tenantSetting.findUnique({ where: { tenantId } });
    },
    upsertUserSecurity(userId, data) {
        return prisma.userSecurity.upsert({
            where: { userId },
            create: { userId, ...data },
            update: data,
        });
    },
    createTenantWithOwner(input) {
        return prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: input.tenantName,
                    slug: input.tenantName.toLowerCase().replace(/\s+/g, "-"),
                    company: { create: { legalName: input.companyName } },
                },
            });
            const ownerRole = await tx.role.findFirst({
                where: { tenantId: tenant.id, code: "TENANT_OWNER" },
            });
            const role = ownerRole
                ?? await tx.role.create({
                    data: {
                        tenantId: tenant.id,
                        name: "Tenant Owner",
                        code: "TENANT_OWNER",
                        isSystem: true,
                    },
                });
            const user = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    roleId: role.id,
                    fullName: input.fullName,
                    email: input.email,
                    passwordHash: input.passwordHash,
                },
            });
            await tx.teamMember.create({
                data: {
                    tenantId: tenant.id,
                    userId: user.id,
                    invitedById: user.id,
                },
            });
            await tx.tenantSetting.create({ data: { tenantId: tenant.id } });
            await tx.tenantQuota.create({ data: { tenantId: tenant.id } });
            return { tenant, user, role };
        });
    },
};
