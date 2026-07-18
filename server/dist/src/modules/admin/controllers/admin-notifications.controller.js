import { z } from "zod";
import { prisma } from "../../../config/prisma.js";
const createNotificationSchema = z.object({
    userId: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(4000),
});
export const adminNotificationsController = {
    async list(_req, res) {
        const items = await prisma.notification.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
            take: 500,
        });
        res.json({ notifications: items });
    },
    async create(req, res) {
        const dto = createNotificationSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { id: dto.userId },
            select: { id: true, tenantId: true },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const created = await prisma.notification.create({
            data: {
                tenantId: user.tenantId,
                userId: user.id,
                title: dto.title,
                body: dto.body,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
        });
        res.status(201).json(created);
    },
};
