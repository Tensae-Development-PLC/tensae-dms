import type { Request, Response } from "express";
import { prisma } from "../../../config/prisma.js";

export const adminUsersController = {
  async list(_req: Request, res: Response) {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        tenant: { include: { company: true } },
        role: true,
      },
      take: 1000,
    });

    res.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        company: u.tenant?.company?.legalName ?? u.tenant?.name ?? null,
        role: u.role?.name ?? null,
        status: String(u.status).toLowerCase(),
        lastActive: u.updatedAt.toISOString(),
        lastLogin: null,
        loginIp: null,
      })),
    });
  },
};
