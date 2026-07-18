import { prisma } from "../../../config/prisma.js";
import { createIpRuleSchema } from "../dto/admin-security.dto.js";
export const adminSecurityController = {
    async overview(_req, res) {
        const now = new Date();
        const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const [activeSessions, failedLogins24h, securityAlerts24h] = await Promise.all([
            prisma.refreshToken.count({ where: { revokedAt: null, expiresAt: { gt: now } } }),
            prisma.auditLog.count({ where: { action: "auth.login.failed", createdAt: { gte: since24h } } }),
            prisma.auditLog.count({ where: { action: { in: ["auth.login.failed", "admin.auth.login.failed"] }, createdAt: { gte: since24h } } }),
        ]);
        const blockedIps = 0;
        res.status(200).json({
            stats: {
                activeSessions,
                failedLogins24h,
                blockedIps,
                securityAlerts24h,
            },
        });
    },
    async loginActivity(req, res) {
        const limit = Math.min(Number(req.query.limit ?? 50) || 50, 200);
        const logs = await prisma.auditLog.findMany({
            where: { action: { in: ["auth.login", "auth.login.failed", "admin.auth.login", "admin.auth.login.failed"] } },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: { actor: { select: { id: true, fullName: true, email: true } } },
        });
        const activity = logs.map((l) => {
            const meta = (() => {
                try {
                    return l.metadata ? JSON.parse(l.metadata) : {};
                }
                catch {
                    return {};
                }
            })();
            return {
                id: l.id,
                status: l.action.endsWith(".failed") ? "failed" : "success",
                timestamp: l.createdAt.toISOString(),
                ip: typeof meta.ip === "string" ? meta.ip : null,
                userAgent: typeof meta.userAgent === "string" ? meta.userAgent : null,
                user: l.actor?.email ?? (typeof meta.email === "string" ? meta.email : null),
                name: l.actor?.fullName ?? null,
                tenantId: l.tenantId ?? null,
            };
        });
        res.status(200).json({ activity });
    },
    async failedAttempts(_req, res) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const logs = await prisma.auditLog.findMany({
            where: { action: "auth.login.failed", createdAt: { gte: since } },
            orderBy: { createdAt: "desc" },
            take: 1000,
        });
        const map = new Map();
        for (const l of logs) {
            let meta = {};
            try {
                meta = l.metadata ? JSON.parse(l.metadata) : {};
            }
            catch {
                meta = {};
            }
            const ip = typeof meta.ip === "string" && meta.ip ? meta.ip : null;
            if (!ip)
                continue;
            const key = ip;
            const existing = map.get(key);
            if (existing) {
                existing.attempts += 1;
                if (l.createdAt > existing.lastAttempt)
                    existing.lastAttempt = l.createdAt;
            }
            else {
                map.set(key, { ip, attempts: 1, lastAttempt: l.createdAt, user: typeof meta.email === "string" ? meta.email : null });
            }
        }
        const rows = Array.from(map.values())
            .sort((a, b) => b.attempts - a.attempts)
            .slice(0, 50);
        res.status(200).json({
            attempts: rows.map((r) => ({
                ip: r.ip,
                attempts: r.attempts,
                lastAttempt: r.lastAttempt.toISOString(),
                status: r.attempts >= 10 ? "blocked" : "warning",
                user: r.user ?? "Multiple",
            })),
        });
    },
    async listIpRules(_req, res) {
        const rules = await prisma.globalIpRule.findMany({ orderBy: { createdAt: "desc" } });
        const blocked = rules.filter((r) => r.type === "BLOCK");
        const whitelisted = rules.filter((r) => r.type === "WHITELIST");
        res.status(200).json({ blocked, whitelisted });
    },
    async createIpRule(req, res) {
        const dto = createIpRuleSchema.parse(req.body);
        const created = await prisma.globalIpRule.upsert({
            where: { type_ipCidr: { type: dto.type, ipCidr: dto.ipCidr } },
            create: { type: dto.type, ipCidr: dto.ipCidr, description: dto.description, reason: dto.reason },
            update: { description: dto.description, reason: dto.reason },
        });
        res.status(201).json({ rule: created });
    },
    async deleteIpRule(req, res) {
        const id = String(req.params.id);
        await prisma.globalIpRule.delete({ where: { id } });
        res.status(200).json({ deleted: true });
    },
};
