import { createApiKeySchema, createDocumentSchema, createFolderSchema, createNotificationSchema, createShareSchema, inviteTeamByEmailSchema, createWorkflowSchema, inviteTeamSchema, updateProfileSecuritySchema, updateSettingsSchema, } from "../dto/client.dto.js";
import { clientService } from "../services/client.service.js";
import { storageService } from "../../../storage/storage.service.js";
import { AppError } from "../../../common/utils/app-error.js";
import { prisma } from "../../../config/prisma.js";
import { issueSignedDownloadToken } from "../../../security/signed-url.service.js";
import { virusScanner } from "../../../security/virus-scanner.js";
import { jobDispatcher } from "../../../jobs/services/job-dispatcher.service.js";
import { env } from "../../../config/env.js";
import { auditService } from "../../audit/services/audit.service.js";
const allowedMimeTypes = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
]);
const context = (req) => ({
    tenantId: req.requestContext?.tenantId ?? "",
    userId: req.requestContext?.userId ?? "",
});
export const clientController = {
    async createFolder(req, res) {
        const dto = createFolderSchema.parse(req.body);
        const ctx = context(req);
        const item = await clientService.createFolder(ctx.tenantId, ctx.userId, dto);
        res.status(201).json(item);
    },
    async listFolders(req, res) {
        const { tenantId } = context(req);
        res.json(await clientService.listFolders(tenantId));
    },
    async createDocument(req, res) {
        const dto = createDocumentSchema.parse(req.body);
        const ctx = context(req);
        res.status(201).json(await clientService.createDocument(ctx.tenantId, ctx.userId, dto));
    },
    async uploadDocument(req, res) {
        const ctx = context(req);
        const file = req.file;
        if (!file) {
            throw new AppError(400, "No file uploaded");
        }
        if (!allowedMimeTypes.has(file.mimetype)) {
            throw new AppError(400, "Unsupported file type");
        }
        const key = `${ctx.tenantId}/${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
        const scanResult = await virusScanner.scan(file.buffer, { filename: file.originalname, mimeType: file.mimetype });
        if (scanResult === "infected") {
            throw new AppError(400, "File rejected by virus scanner");
        }
        await storageService.put(key, file.buffer);
        const item = await clientService.createDocument(ctx.tenantId, ctx.userId, {
            name: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: BigInt(file.size),
            storageKey: key,
        });
        await jobDispatcher.enqueueDocumentExpiryAlert({ tenantId: ctx.tenantId, documentId: item.id, checkAfterHours: 24 });
        res.status(201).json(item);
    },
    async signedDownloadUrl(req, res) {
        const ctx = context(req);
        const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
        const document = await clientService.findDocumentByIdForTenant(documentId, ctx.tenantId);
        if (!document) {
            throw new AppError(404, "Document not found");
        }
        const token = issueSignedDownloadToken({ documentId, tenantId: ctx.tenantId, userId: ctx.userId }, 10 * 60);
        const configured = typeof env.PUBLIC_APP_BASE_URL === "string" ? env.PUBLIC_APP_BASE_URL.replace(/\/$/, "").trim() : "";
        const base = configured || `${req.protocol}://${req.get("host")}`;
        const url = `${base}/api/v1/client/documents/${documentId}/download?token=${encodeURIComponent(token)}`;
        res.json({ url, expiresInSeconds: 600 });
    },
    async streamDownload(req, res) {
        const ctx = context(req);
        const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
        const document = await clientService.findDocumentByIdForTenant(documentId, ctx.tenantId);
        if (!document) {
            throw new AppError(404, "Document not found");
        }
        res.setHeader("Content-Type", document.mimeType);
        res.setHeader("Content-Disposition", `attachment; filename="${document.name}"`);
        const stream = await storageService.getReadStream(document.storageKey);
        stream.pipe(res);
    },
    async listDocuments(req, res) {
        const { tenantId } = context(req);
        res.json(await clientService.listDocuments(tenantId));
    },
    async shareDocument(req, res) {
        const dto = createShareSchema.parse(req.body);
        const ctx = context(req);
        res.status(201).json(await clientService.shareDocument(ctx.tenantId, ctx.userId, dto));
    },
    async listSharedLinks(req, res) {
        const { tenantId } = context(req);
        res.json(await clientService.listSharedLinks(tenantId));
    },
    async favoriteDocument(req, res) {
        const { tenantId, userId } = context(req);
        const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
        res.status(201).json(await clientService.favoriteDocument(tenantId, userId, documentId));
    },
    async listFavorites(req, res) {
        const { tenantId, userId } = context(req);
        res.json(await clientService.listFavorites(tenantId, userId));
    },
    async createWorkflow(req, res) {
        const dto = createWorkflowSchema.parse(req.body);
        const ctx = context(req);
        res.status(201).json(await clientService.createWorkflow(ctx.tenantId, ctx.userId, dto));
    },
    async listWorkflows(req, res) {
        const { tenantId } = context(req);
        res.json(await clientService.listWorkflows(tenantId));
    },
    async createNotification(req, res) {
        const dto = createNotificationSchema.parse(req.body);
        const ctx = context(req);
        res.status(201).json(await clientService.notify(ctx.tenantId, ctx.userId, dto));
    },
    async listNotifications(req, res) {
        const { tenantId, userId } = context(req);
        res.json(await clientService.listNotifications(tenantId, userId));
    },
    async inviteMember(req, res) {
        const dto = inviteTeamSchema.parse(req.body);
        const ctx = context(req);
        res.status(201).json(await clientService.inviteMember(ctx.tenantId, ctx.userId, dto.userId));
    },
    async inviteMemberByEmail(req, res) {
        const dto = inviteTeamByEmailSchema.parse(req.body);
        const ctx = context(req);
        const inviter = await prisma.user.findUnique({
            where: { id: ctx.userId },
            select: { fullName: true, email: true, tenant: { select: { name: true } } },
        });
        if (!inviter) {
            throw new AppError(404, "Inviter not found");
        }
        const appBase = env.PUBLIC_APP_BASE_URL ?? `${req.protocol}://${req.get("host")}`;
        const inviteUrl = `${appBase}/invite/accept?email=${encodeURIComponent(dto.email)}&role=${encodeURIComponent(dto.role)}&company=${encodeURIComponent(inviter.tenant?.name ?? "Workspace")}&invitedBy=${encodeURIComponent(inviter.fullName)}${dto.department ? `&department=${encodeURIComponent(dto.department)}` : ""}`;
        await jobDispatcher.enqueueEmail({
            tenantId: ctx.tenantId,
            userId: ctx.userId,
            template: "team-invite",
            email: dto.email,
            role: dto.role,
            department: dto.department,
            expiryDate: dto.expiryDate,
            companyName: inviter.tenant?.name ?? "Workspace",
            invitedBy: inviter.fullName,
            inviteUrl,
        });
        await auditService.log({
            tenantId: ctx.tenantId,
            actorUserId: ctx.userId,
            action: "team.invite.email",
            entity: "invite",
            entityId: dto.email,
            metadata: { email: dto.email, role: dto.role, department: dto.department ?? null },
        });
        res.status(201).json({ accepted: true });
    },
    async listTeam(req, res) {
        const { tenantId } = context(req);
        res.json(await clientService.listTeamMembers(tenantId));
    },
    async listRoles(req, res) {
        const { tenantId } = context(req);
        res.json(await clientService.listRoles(tenantId));
    },
    async updateSettings(req, res) {
        const dto = updateSettingsSchema.parse(req.body);
        const ctx = context(req);
        res.json(await clientService.updateSettings(ctx.tenantId, ctx.userId, dto));
    },
    async getSettings(req, res) {
        const { tenantId } = context(req);
        res.json(await clientService.getSettings(tenantId));
    },
    async createApiKey(req, res) {
        const dto = createApiKeySchema.parse(req.body);
        const ctx = context(req);
        res.status(201).json(await clientService.createApiKey(ctx.tenantId, ctx.userId, dto));
    },
    async listApiKeys(req, res) {
        const { tenantId } = context(req);
        res.json(await clientService.listApiKeys(tenantId));
    },
    async updateProfileSecurity(req, res) {
        const dto = updateProfileSecuritySchema.parse(req.body);
        const { tenantId, userId } = context(req);
        res.json(await clientService.updateProfileSecurity(userId, tenantId, dto));
    },
    async tenantReport(req, res) {
        const { tenantId, userId } = context(req);
        const [documents, workflows, notifications, favorites, quota] = await Promise.all([
            clientService.listDocuments(tenantId),
            clientService.listWorkflows(tenantId),
            clientService.listNotifications(tenantId, userId),
            clientService.listFavorites(tenantId, userId),
            clientService.getTenantQuota(tenantId),
        ]);
        res.json({
            totals: {
                documents: documents.length,
                workflows: workflows.length,
                notifications: notifications.length,
                favorites: favorites.length,
            },
            quota,
        });
    },
    async quota(req, res) {
        const { tenantId } = context(req);
        res.json(await clientService.getTenantQuota(tenantId));
    },
    async recentActivity(req, res) {
        const { tenantId } = context(req);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
        const rows = await clientService.listAuditLogs(tenantId, limit);
        res.json({
            entries: rows.map((a) => ({
                id: a.id,
                action: a.action,
                entity: a.entity,
                entityId: a.entityId,
                createdAt: a.createdAt.toISOString(),
                actorEmail: a.actor?.email,
                actorName: a.actor?.fullName,
                metadata: a.metadata,
            })),
        });
    },
};
