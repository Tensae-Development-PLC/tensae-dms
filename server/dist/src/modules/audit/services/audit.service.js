import { prisma } from "../../../config/prisma.js";
export const auditService = {
    log(input) {
        return prisma.auditLog.create({
            data: {
                tenantId: input.tenantId,
                actorUserId: input.actorUserId,
                action: input.action,
                entity: input.entity,
                entityId: input.entityId,
                metadata: input.metadata ? JSON.stringify(input.metadata) : null,
            },
        });
    },
};
