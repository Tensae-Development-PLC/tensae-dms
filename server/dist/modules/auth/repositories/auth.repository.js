import { prisma } from "../../../config/prisma.js";
export const authRepository = {
    findUserByEmailWithinTenant(email, tenantId) {
        return prisma.user.findFirst({
            where: { email, tenantId, isActive: true },
            include: { role: true },
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
            return { tenant, user, role };
        });
    },
};
