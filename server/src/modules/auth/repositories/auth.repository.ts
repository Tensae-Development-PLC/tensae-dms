import { prisma } from "../../../config/prisma.js";

export const authRepository = {
  listTenantsForEmail(email: string) {
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
  findUserByEmailWithinTenant(email: string, tenantId: string) {
    return prisma.user.findFirst({
      where: { email, tenantId, isActive: true },
      include: { role: true, profileSecurity: true },
    });
  },
  findUserById(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, include: { role: true, profileSecurity: true } });
  },
  createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
  },
  findValidRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: { include: { role: true, profileSecurity: true } } },
    });
  },
  revokeRefreshToken(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
  createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
  },
  findValidPasswordResetToken(tokenHash: string) {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
  },
  markPasswordResetTokenUsed(id: string) {
    return prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  },
  updateUserPassword(userId: string, passwordHash: string) {
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },
  getTenantSettings(tenantId: string) {
    return prisma.tenantSetting.findUnique({ where: { tenantId } });
  },
  upsertUserSecurity(userId: string, data: { twoFactorEnabled?: boolean; twoFactorSecret?: string | null; twoFactorPendingSecret?: string | null; recoveryCodesHash?: string | null }) {
    return prisma.userSecurity.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },
  createTenantWithOwner(input: {
    tenantName: string;
    companyName: string;
    fullName: string;
    email: string;
    passwordHash: string;
  }) {
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
  createInvite(tenantId: string, email: string, roleId: string, token: string, expiresAt: Date) {
    return prisma.invite.upsert({
      where: { tenantId_email: { tenantId, email } },
      create: { tenantId, email, roleId, token, expiresAt },
      update: { token, expiresAt, acceptedAt: null },
    });
  },
  findInviteByTokenAndEmail(token: string, email: string) {
    return prisma.invite.findFirst({
      where: { token, email },
    });
  },
  markInviteAccepted(inviteId: string) {
    return prisma.invite.update({
      where: { id: inviteId },
      data: { acceptedAt: new Date() },
    });
  },
  createUserInTenant(data: { tenantId: string; roleId: string; fullName: string; email: string; passwordHash: string }) {
    return prisma.user.create({
      data,
      include: { role: true },
    });
  },
  createTeamMember(tenantId: string, userId: string, invitedById: string) {
    return prisma.teamMember.create({
      data: { tenantId, userId, invitedById },
    });
  },
};
