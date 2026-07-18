import type { Request, Response } from "express";
import { prisma } from "../../../config/prisma.js";

export const adminAuditController = {
  async recent(req: Request, res: Response) {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const rows = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { email: true, fullName: true } } },
    });
    res.json({
      entries: rows.map((a) => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        tenantId: a.tenantId,
        createdAt: a.createdAt.toISOString(),
        actorEmail: a.actor?.email,
        actorName: a.actor?.fullName,
      })),
    });
  },
};
