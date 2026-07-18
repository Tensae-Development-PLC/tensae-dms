import { prisma } from "../../../config/prisma.js";

export const rbacService = {
  listRoles(tenantId: string) {
    return prisma.role.findMany({
      where: { tenantId },
      include: { permissions: { include: { permission: true } } },
    });
  },
};
