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
    async getStorageMetrics() {
        // Get overall storage stats
        const [totalBytes, quotas] = await Promise.all([
            prisma.document.aggregate({ _sum: { sizeBytes: true } }),
            prisma.tenantQuota.findMany(),
        ]);
        const overallUsedBytes = totalBytes._sum.sizeBytes ?? BigInt(0);
        const totalLimitBytes = BigInt(quotas.reduce((sum, q) => sum + q.storageLimitMb, 0) * 1024 * 1024);
        // Get per-tenant storage usage
        const tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                company: { select: { legalName: true } },
                quota: true,
                documents: {
                    select: { sizeBytes: true }
                }
            }
        });
        const companyStorage = tenants.map(t => {
            const usedBytes = t.documents.reduce((sum, doc) => sum + doc.sizeBytes, BigInt(0));
            const limitBytes = t.quota ? t.quota.storageLimitMb * 1024 * 1024 : 0;
            const usedMb = Number(usedBytes) / (1024 * 1024);
            const limitMb = limitBytes / (1024 * 1024);
            const percentage = limitMb > 0 ? Math.round((usedMb / limitMb) * 100) : 0;
            return {
                tenantId: t.id,
                name: t.company?.legalName || t.name,
                usedGb: Math.round(usedMb / 1024 * 10) / 10,
                limitGb: Math.round(limitMb / 1024 * 10) / 10,
                percentage,
                usedBytes: usedBytes.toString(),
                limitBytes: limitBytes.toString(),
            };
        });
        // Sort by usage (highest first)
        companyStorage.sort((a, b) => b.percentage - a.percentage);
        const nearLimitCount = companyStorage.filter(c => c.percentage >= 75).length;
        return {
            overall: {
                totalUsedGb: Math.round(Number(overallUsedBytes) / (1024 * 1024 * 1024) * 10) / 10,
                totalLimitGb: Math.round(Number(totalLimitBytes) / (1024 * 1024 * 1024) * 10) / 10,
                percentageUsed: totalLimitBytes > BigInt(0) ? Math.round((Number(overallUsedBytes) / Number(totalLimitBytes)) * 100) : 0,
            },
            companies: companyStorage,
            nearLimitCount,
        };
    },
    async getDetailedReports() {
        // KPI Metrics
        const since30days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const since60days = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const [documentsTotal, documentsLast30, documentsLast60, usersTotal, usersLast30, tenantsTotal, tenantsLast30, auditEventsLast30,] = await Promise.all([
            prisma.document.count(),
            prisma.document.count({ where: { createdAt: { gte: since30days } } }),
            prisma.document.count({ where: { createdAt: { gte: since60days } } }),
            prisma.user.count({ where: { isActive: true } }),
            prisma.user.count({ where: { isActive: true, createdAt: { gte: since30days } } }),
            prisma.tenant.count(),
            prisma.tenant.count({ where: { createdAt: { gte: since30days } } }),
            prisma.auditLog.count({ where: { createdAt: { gte: since30days } } }),
        ]);
        const docChange = documentsLast60 > 0 ? Math.round(((documentsLast30 - (documentsLast60 - documentsLast30)) / (documentsLast60 - documentsLast30)) * 100) : 0;
        const userChange = usersLast30 > 0 ? 100 : 0; // Placeholder: would need historical tracking
        return {
            kpis: [
                {
                    title: 'Total Documents',
                    value: documentsTotal.toLocaleString(),
                    change: `+${docChange}%`,
                    trend: docChange >= 0 ? 'up' : 'down',
                },
                {
                    title: 'Active Users',
                    value: usersTotal.toLocaleString(),
                    change: `+${usersLast30}`,
                    trend: 'up',
                },
                {
                    title: 'Tenants',
                    value: tenantsTotal.toLocaleString(),
                    change: `+${tenantsLast30}`,
                    trend: 'up',
                },
                {
                    title: 'Audit Events (30d)',
                    value: auditEventsLast30.toLocaleString(),
                    change: 'This month',
                    trend: 'stable',
                },
            ],
            topTenants: await prisma.tenant.findMany({
                take: 5,
                select: {
                    id: true,
                    name: true,
                    company: { select: { legalName: true } },
                    _count: { select: { documents: true, users: true } },
                    documents: { select: { sizeBytes: true } }
                },
                orderBy: { documents: { _count: 'desc' } }
            }).then(tenants => tenants.map(t => {
                const bytes = t.documents.reduce((sum, d) => sum + d.sizeBytes, BigInt(0));
                return {
                    name: t.company?.legalName || t.name,
                    documents: t._count.documents,
                    users: t._count.users,
                    storageGb: Math.round(Number(bytes) / (1024 * 1024 * 1024) * 10) / 10,
                };
            })),
        };
    },
};
