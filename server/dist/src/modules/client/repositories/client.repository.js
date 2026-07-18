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
            data: { tenantId, ownerUserId: userId, name: input.name, mimeType: input.mimeType, sizeBytes: input.sizeBytes, storageKey: input.storageKey, folderId: input.folderId },
        });
    },
    listDocuments(tenantId) {
        return prisma.document.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            include: { owner: { select: { id: true, fullName: true, email: true } } },
        });
    },
    findDocumentByIdForTenant(documentId, tenantId) {
        return prisma.document.findFirst({ where: { id: documentId, tenantId } });
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
    listFavorites(tenantId, userId) {
        return prisma.favorite.findMany({ where: { tenantId, userId }, include: { document: true } });
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
};
