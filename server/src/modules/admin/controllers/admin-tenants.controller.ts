import type { Request, Response } from "express";
import { prisma } from "../../../config/prisma.js";

export const adminTenantsController = {
  async list(_req: Request, res: Response) {
    const rows = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        company: true,
        quota: true,
        _count: { select: { users: true, documents: true } },
      },
    });
    res.json({
      tenants: rows.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        companyName: t.company?.legalName ?? t.name,
        userCount: t._count.users,
        documentCount: t._count.documents,
        storageUsedMb: t.quota?.storageUsedMb ?? 0,
        storageLimitMb: t.quota?.storageLimitMb ?? 10240,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  },
};
