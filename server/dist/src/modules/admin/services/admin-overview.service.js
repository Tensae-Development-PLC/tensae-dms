import { prisma } from "../../../config/prisma.js";
export const adminOverviewService = {
    async snapshot() {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [tenants, users, documents, auditEvents24h, sizeSum] = await Promise.all([
            prisma.tenant.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.document.count(),
            prisma.auditLog.count({ where: { createdAt: { gte: since24h } } }),
            prisma.document.aggregate({ _sum: { sizeBytes: true } }),
        ]);
        const bytes = sizeSum._sum.sizeBytes ?? BigInt(0);
        return {
            counts: {
                tenants,
                users,
                documents,
                auditEvents24h,
            },
            storageBytesTotal: bytes.toString(),
        };
    },
};
