import crypto from "node:crypto";
import { prisma } from "../../../config/prisma.js";
export const clientRepository = {
    createFolder(tenantId, userId, input) {
        return prisma.folder.create({ data: { tenantId, createdById: userId, name: input.name, parentId: input.parentId } });
    },
    listFolders(tenantId) {
        return prisma.folder.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { documents: true } } },
        });
    },
    createDocument(tenantId, userId, input) {
        return prisma.document.create({
            data: {
                tenantId,
                ownerUserId: userId,
                name: input.name,
                mimeType: input.mimeType,
                sizeBytes: input.sizeBytes,
                storageKey: input.storageKey,
                folderId: input.folderId,
                scanStatus: input.scanStatus ?? "CLEAN",
            },
        });
    },
    listDocuments(tenantId, opts) {
        const where = { tenantId };
        if (opts?.archived) {
            where.archivedAt = { not: null };
        }
        else {
            where.archivedAt = null;
        }
        if (opts?.folderId) {
            where.folderId = opts.folderId;
        }
        else if (opts?.unfiled) {
            where.folderId = null;
        }
        return prisma.document.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: { owner: { select: { id: true, fullName: true, email: true } } },
        });
    },
    archiveDocument(tenantId, documentId) {
        return prisma.document.updateMany({
            where: { id: documentId, tenantId, archivedAt: null },
            data: { archivedAt: new Date() },
        });
    },
    restoreDocument(tenantId, documentId) {
        return prisma.document.updateMany({
            where: { id: documentId, tenantId },
            data: { archivedAt: null },
        });
    },
    markAllNotificationsRead(tenantId, userId) {
        return prisma.notification.updateMany({
            where: { tenantId, userId, readAt: null },
            data: { readAt: new Date() },
        });
    },
    findDocumentByIdForTenant(documentId, tenantId) {
        return prisma.document.findFirst({ where: { id: documentId, tenantId } });
    },
    async deleteDocument(tenantId, documentId) {
        return prisma.$transaction(async (tx) => {
            await tx.favorite.deleteMany({ where: { documentId, tenantId } });
            await tx.sharedLink.deleteMany({ where: { documentId, tenantId } });
            return tx.document.deleteMany({ where: { id: documentId, tenantId } });
        });
    },
    renameDocument(tenantId, documentId, name) {
        return prisma.document.updateMany({ where: { id: documentId, tenantId }, data: { name } });
    },
    findSharedLinkByToken(token) {
        return prisma.sharedLink.findUnique({
            where: { token },
            include: {
                document: {
                    select: {
                        id: true,
                        name: true,
                        mimeType: true,
                        sizeBytes: true,
                        storageKey: true,
                        createdAt: true,
                    },
                },
            },
        });
    },
    createSharedLink(tenantId, input) {
        return prisma.sharedLink.create({
            data: { tenantId, documentId: input.documentId, expiresAt: input.expiresAt, allowDownload: input.allowDownload, token: crypto.randomBytes(16).toString("hex") },
        });
    },
    listSharedLinks(tenantId) {
        return prisma.sharedLink.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            include: {
                document: {
                    select: {
                        id: true,
                        name: true,
                        mimeType: true,
                        createdAt: true,
                    },
                },
            },
        });
    },
    addFavorite(tenantId, userId, documentId) {
        return prisma.favorite.upsert({
            where: { userId_documentId: { userId, documentId } },
            create: { tenantId, userId, documentId },
            update: {},
        });
    },
    removeFavorite(tenantId, userId, documentId) {
        return prisma.favorite.deleteMany({ where: { tenantId, userId, documentId } });
    },
    listFavorites(tenantId, userId) {
        return prisma.favorite.findMany({ where: { tenantId, userId }, include: { document: true } });
    },
    deleteSharedLink(tenantId, linkId) {
        return prisma.sharedLink.deleteMany({ where: { id: linkId, tenantId } });
    },
    renameFolder(tenantId, folderId, name) {
        return prisma.folder.updateMany({ where: { id: folderId, tenantId }, data: { name } });
    },
    async deleteFolder(tenantId, folderId) {
        const folder = await prisma.folder.findFirst({ where: { id: folderId, tenantId } });
        if (!folder)
            return { deleted: false };
        const childCount = await prisma.folder.count({ where: { parentId: folderId, tenantId } });
        if (childCount > 0) {
            throw new Error("FOLDER_HAS_CHILDREN");
        }
        const docCount = await prisma.document.count({ where: { folderId, tenantId } });
        if (docCount > 0) {
            throw new Error("FOLDER_HAS_DOCUMENTS");
        }
        await prisma.folder.deleteMany({ where: { id: folderId, tenantId } });
        return { deleted: true };
    },
    searchDocuments(tenantId, query) {
        return prisma.document.findMany({
            where: {
                tenantId,
                archivedAt: null,
                name: { contains: query, mode: "insensitive" },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
            include: { owner: { select: { id: true, fullName: true, email: true } } },
        });
    },
    createWorkflow(tenantId, input) {
        return prisma.workflow.create({ data: { tenantId, name: input.name, definition: input.definition } });
    },
    listWorkflows(tenantId) {
        return prisma.workflow.findMany({ where: { tenantId } });
    },
    createNotification(tenantId, input) {
        return prisma.notification.create({ data: { tenantId, userId: input.userId, title: input.title, body: input.body } });
    },
    listNotifications(tenantId, userId) {
        return prisma.notification.findMany({ where: { tenantId, userId }, orderBy: { createdAt: "desc" } });
    },
    inviteTeamMember(tenantId, userId, invitedById) {
        return prisma.teamMember.upsert({
            where: { tenantId_userId: { tenantId, userId } },
            create: { tenantId, userId, invitedById },
            update: { invitedById },
        });
    },
    listTeamMembers(tenantId) {
        return prisma.teamMember.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
    },
    listUsersByIds(tenantId, userIds) {
        return prisma.user.findMany({
            where: { tenantId, id: { in: userIds } },
            select: {
                id: true,
                fullName: true,
                email: true,
                status: true,
                role: { select: { id: true, name: true, code: true, isSystem: true } },
            },
        });
    },
    listRoles(tenantId) {
        return prisma.role.findMany({
            where: { tenantId },
            orderBy: { createdAt: "asc" },
            include: {
                _count: { select: { users: true } },
            },
        });
    },
    getRoleById(tenantId, roleId) {
        return prisma.role.findFirst({
            where: { id: roleId, tenantId },
            include: {
                permissions: { include: { permission: true } },
                _count: { select: { users: true } },
            },
        });
    },
    updateSettings(tenantId, input) {
        return prisma.tenantSetting.upsert({
            where: { tenantId },
            create: { tenantId, ...input },
            update: input,
        });
    },
    getSettings(tenantId) {
        return prisma.tenantSetting.findUnique({ where: { tenantId } });
    },
    createApiKey(tenantId, input) {
        return prisma.apiKey.create({ data: { tenantId, name: input.name, keyHash: input.keyHash, expiresAt: input.expiresAt } });
    },
    listApiKeys(tenantId) {
        return prisma.apiKey.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
    },
    deleteApiKey(tenantId, apiKeyId) {
        return prisma.apiKey.deleteMany({ where: { id: apiKeyId, tenantId } });
    },
    updateProfileSecurity(userId, input) {
        return prisma.userSecurity.upsert({
            where: { userId },
            create: { userId, ...input, passwordChangedAt: new Date() },
            update: input,
        });
    },
    getTenantQuota(tenantId) {
        return prisma.tenantQuota.findUnique({ where: { tenantId } });
    },
    listAuditLogs(tenantId, limit) {
        return prisma.auditLog.findMany({
            where: { tenantId },
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { actor: { select: { email: true, fullName: true } } },
        });
    },
    incrementQuotaUsage(tenantId, deltaMb) {
        return prisma.tenantQuota.update({
            where: { tenantId },
            data: { storageUsedMb: { increment: deltaMb } },
        });
    },
    decrementQuotaUsage(tenantId, deltaMb) {
        return prisma.tenantQuota.update({
            where: { tenantId },
            data: { storageUsedMb: { decrement: deltaMb } },
        });
    },
};
