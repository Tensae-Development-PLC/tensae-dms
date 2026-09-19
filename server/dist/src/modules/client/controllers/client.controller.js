import { createApiKeySchema, createFolderSchema, createNotificationSchema, createShareSchema, inviteTeamByEmailSchema, createWorkflowSchema, inviteTeamSchema, updateSettingsSchema, } from "../dto/client.dto.js";
import { clientService } from "../services/client.service.js";
import { storageService } from "../../../storage/storage.service.js";
import { ALLOWED_INVITE_ROLE_CODES, normalizeRoleCode, RESERVED_ROLE_CODES } from "../../../common/utils/reserved-roles.js";
import { AppError } from "../../../common/utils/app-error.js";
import { prisma } from "../../../config/prisma.js";
import { issueSignedDownloadToken } from "../../../security/signed-url.service.js";
import { virusScanner } from "../../../security/virus-scanner.js";
import { jobDispatcher } from "../../../jobs/services/job-dispatcher.service.js";
import { auditService } from "../../audit/services/audit.service.js";
import { publicApiBaseUrl, publicAppBaseUrl } from "../../../common/utils/public-urls.js";
import { isAllowedUpload } from "../../../common/utils/allowed-mime-types.js";
import { canDownloadDocuments } from "../../../common/utils/document-access.js";
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
    async createDocument(_req, res) {
        // Client-supplied storageKey is unsafe — documents must be created via multipart upload.
        throw new AppError(405, "Use POST /client/documents/upload to create documents");
    },
    async uploadDocument(req, res) {
        const ctx = context(req);
        const file = req.file;
        if (!file) {
            throw new AppError(400, "No file uploaded");
        }
        if (!isAllowedUpload(file.mimetype, file.originalname)) {
            throw new AppError(400, "Unsupported file type");
        }
        // Validate quota BEFORE writing to storage
        const quota = await clientService.getTenantQuota(ctx.tenantId);
        if (quota) {
            const deltaMb = Math.max(1, Math.ceil(file.size / (1024 * 1024)));
            if (quota.storageUsedMb + deltaMb > quota.storageLimitMb) {
                throw new AppError(409, "Storage quota exceeded");
            }
        }
        // Scan file for viruses
        const scanResult = await virusScanner.scan(file.buffer, {
            filename: file.originalname,
            mimeType: file.mimetype
        });
        if (scanResult === "infected") {
            throw new AppError(400, "File rejected by virus scanner");
        }
        // Generate storage key and write file to storage
        const key = `${ctx.tenantId}/${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
        await storageService.put(key, file.buffer);
        // Create document record (metadata-only fields like type/entity/expiry are not stored in V1)
        const documentInput = {
            name: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: BigInt(file.size),
            storageKey: key,
        };
        if (req.body.folderId && typeof req.body.folderId === "string") {
            documentInput.folderId = req.body.folderId;
        }
        try {
            const item = await clientService.createDocument(ctx.tenantId, ctx.userId, {
                ...documentInput,
                scanStatus: "CLEAN",
            });
            res.status(201).json(item);
        }
        catch (err) {
            await storageService.delete(key).catch(() => undefined);
            throw err;
        }
    },
    async signedDownloadUrl(req, res) {
        const ctx = context(req);
        const roleCode = req.auth?.roleCode;
        const previewOnly = req.body?.purpose === "preview" ||
            req.query.inline === "1" ||
            req.query.inline === "true";
        if (!previewOnly && !canDownloadDocuments(roleCode)) {
            throw new AppError(403, "Your role is view-only and cannot download files");
        }
        const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
        const document = await clientService.findDocumentByIdForTenant(documentId, ctx.tenantId);
        if (!document) {
            throw new AppError(404, "Document not found");
        }
        const token = issueSignedDownloadToken({ documentId, tenantId: ctx.tenantId, userId: ctx.userId }, 10 * 60);
        const base = publicApiBaseUrl(`${req.protocol}://${req.get("host")}`);
        const inlineQs = previewOnly ? "&inline=1" : "";
        const url = `${base}/api/v1/client/documents/${documentId}/download?token=${encodeURIComponent(token)}${inlineQs}`;
        res.json({ url, expiresInSeconds: 600, previewOnly });
    },
    async deleteDocument(req, res) {
        const ctx = context(req);
        const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
        const result = await clientService.deleteDocument(ctx.tenantId, ctx.userId, documentId);
        res.json(result);
    },
    async archiveDocument(req, res) {
        const ctx = context(req);
        const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
        const result = await clientService.archiveDocument(ctx.tenantId, ctx.userId, documentId);
        res.json(result);
    },
    async restoreDocument(req, res) {
        const ctx = context(req);
        const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
        const result = await clientService.restoreDocument(ctx.tenantId, ctx.userId, documentId);
        res.json(result);
    },
    async renameDocument(req, res) {
        const ctx = context(req);
        const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
        const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
        if (!name)
            throw new AppError(400, "name is required");
        const result = await clientService.renameDocument(ctx.tenantId, ctx.userId, documentId, name);
        res.json(result);
    },
    async streamDownload(req, res) {
        const ctx = context(req);
        const roleCode = req.auth?.roleCode;
        const inline = req.query.inline === "1" || req.query.inline === "true";
        if (!inline && !canDownloadDocuments(roleCode)) {
            throw new AppError(403, "Your role is view-only and cannot download files");
        }
        const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
        const document = await clientService.findDocumentByIdForTenant(documentId, ctx.tenantId);
        if (!document) {
            throw new AppError(404, "Document not found");
        }
        const safeName = document.name.replace(/["\r\n]/g, "_");
        res.setHeader("Content-Type", document.mimeType);
        res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename="${safeName}"`);
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
        const stream = await storageService.getReadStream(document.storageKey);
        stream.pipe(res);
    },
    async listDocuments(req, res) {
        const { tenantId } = context(req);
        const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
        if (q) {
            res.json(await clientService.searchDocuments(tenantId, q));
            return;
        }
        const folderId = typeof req.query.folderId === "string" ? req.query.folderId : undefined;
        const unfiled = req.query.unfiled === "1" || req.query.unfiled === "true";
        const archived = req.query.archived === "1" || req.query.archived === "true";
        res.json(await clientService.listDocuments(tenantId, { folderId, unfiled, archived }));
    },
    async renameFolder(req, res) {
        const ctx = context(req);
        const folderId = Array.isArray(req.params.folderId) ? req.params.folderId[0] : req.params.folderId;
        const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
        if (!name)
            throw new AppError(400, "name is required");
        res.json(await clientService.renameFolder(ctx.tenantId, ctx.userId, folderId, name));
    },
    async deleteFolder(req, res) {
        const ctx = context(req);
        const folderId = Array.isArray(req.params.folderId) ? req.params.folderId[0] : req.params.folderId;
        res.json(await clientService.deleteFolder(ctx.tenantId, ctx.userId, folderId));
    },
    async revokeSharedLink(req, res) {
        const ctx = context(req);
        const linkId = Array.isArray(req.params.linkId) ? req.params.linkId[0] : req.params.linkId;
        res.json(await clientService.revokeSharedLink(ctx.tenantId, ctx.userId, linkId));
    },
    async unfavoriteDocument(req, res) {
        const { tenantId, userId } = context(req);
        const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
        res.json(await clientService.unfavoriteDocument(tenantId, userId, documentId));
    },
    async resolveSharedLink(req, res) {
        const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
        const link = await clientService.resolveSharedLink(token);
        res.json(link);
    },
    async downloadSharedLink(req, res) {
        const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
        const { document, allowDownload } = await clientService.getSharedLinkForDownload(token);
        if (!allowDownload) {
            throw new AppError(403, "Download is not allowed for this link");
        }
        const safeName = document.name.replace(/["\r\n]/g, "_");
        res.setHeader("Content-Type", document.mimeType);
        res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        const stream = await storageService.getReadStream(document.storageKey);
        stream.pipe(res);
    },
    async viewSharedLink(req, res) {
        const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
        const { document } = await clientService.getSharedLinkForDownload(token);
        // Preview stream (inline). Download remains gated on allowDownload separately.
        const safeName = document.name.replace(/["\r\n]/g, "_");
        res.setHeader("Content-Type", document.mimeType);
        res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
        const stream = await storageService.getReadStream(document.storageKey);
        stream.pipe(res);
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
    async markAllNotificationsRead(req, res) {
        const { tenantId, userId } = context(req);
        res.json(await clientService.markAllNotificationsRead(tenantId, userId));
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
        // Resolve role by code or name (invite UI sends ids like "VIEWER", "ADMIN")
        const roleKey = dto.role.trim();
        const roleKeyUpper = normalizeRoleCode(roleKey);
        if (roleKeyUpper === "SYS_ADMIN" || roleKeyUpper === "TENANT_OWNER") {
            throw new AppError(400, "Invalid role");
        }
        if (!ALLOWED_INVITE_ROLE_CODES.has(roleKeyUpper) && RESERVED_ROLE_CODES.has(roleKeyUpper)) {
            throw new AppError(400, "Invalid role");
        }
        let role = await prisma.role.findFirst({
            where: {
                tenantId: ctx.tenantId,
                OR: [
                    { code: { equals: roleKeyUpper, mode: "insensitive" } },
                    { name: { equals: roleKey, mode: "insensitive" } },
                    { code: { equals: roleKey, mode: "insensitive" } },
                ],
            },
        });
        // Create standard invite roles on demand (allowlist only)
        if (!role) {
            if (!ALLOWED_INVITE_ROLE_CODES.has(roleKeyUpper)) {
                throw new AppError(400, "Invalid role");
            }
            const displayName = roleKey
                .split(/[_\s-]+/)
                .filter(Boolean)
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(" ");
            role = await prisma.role.create({
                data: {
                    tenantId: ctx.tenantId,
                    name: displayName || roleKeyUpper,
                    code: roleKeyUpper,
                    isSystem: false,
                },
            });
        }
        // Generate invite token
        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        // Create or update invite record
        await prisma.invite.upsert({
            where: { tenantId_email: { tenantId: ctx.tenantId, email: dto.email } },
            create: { tenantId: ctx.tenantId, email: dto.email, roleId: role.id, token, expiresAt },
            update: { token, expiresAt, acceptedAt: null, roleId: role.id },
        });
        const appBase = publicAppBaseUrl(`${req.protocol}://${req.get("host")}`);
        const inviteUrl = `${appBase}/invite/accept?email=${encodeURIComponent(dto.email)}&token=${encodeURIComponent(token)}`;
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
    async getRoleById(req, res) {
        const { tenantId } = context(req);
        const roleId = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
        const role = await clientService.getRoleById(tenantId, roleId);
        if (!role) {
            throw new AppError(404, "Role not found");
        }
        res.json(role);
    },
    async createRole(req, res) {
        const ctx = context(req);
        const { name, description, permissions } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            throw new AppError(400, "Role name is required");
        }
        // Check if role with same name already exists
        const existing = await prisma.role.findFirst({
            where: { tenantId: ctx.tenantId, name: name.trim() }
        });
        if (existing) {
            throw new AppError(409, "Role with this name already exists");
        }
        // Generate uppercase code from name (e.g. Staff → STAFF) for RBAC matching
        const code = normalizeRoleCode(name);
        if (RESERVED_ROLE_CODES.has(code)) {
            throw new AppError(400, `Role code "${code}" is reserved`);
        }
        // Create role
        const role = await prisma.role.create({
            data: {
                tenantId: ctx.tenantId,
                name: name.trim(),
                code,
                isSystem: false,
            },
            include: {
                permissions: { include: { permission: true } },
                _count: { select: { users: true } }
            }
        });
        // Add permissions if provided
        if (Array.isArray(permissions) && permissions.length > 0) {
            const permissionRecords = await prisma.permission.findMany({
                where: { code: { in: permissions } }
            });
            if (permissionRecords.length > 0) {
                await prisma.rolePermission.createMany({
                    data: permissionRecords.map(p => ({
                        roleId: role.id,
                        permissionId: p.id
                    }))
                });
            }
        }
        await auditService.log({
            tenantId: ctx.tenantId,
            actorUserId: ctx.userId,
            action: "role.create",
            entity: "role",
            entityId: role.id,
            metadata: { name, code }
        });
        res.status(201).json(role);
    },
    async updateRole(req, res) {
        const ctx = context(req);
        const roleId = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
        const { name, description, permissions } = req.body;
        // Get current role
        const role = await prisma.role.findUnique({
            where: { id: roleId },
            include: { tenant: true }
        });
        if (!role) {
            throw new AppError(404, "Role not found");
        }
        if (role.tenantId !== ctx.tenantId) {
            throw new AppError(403, "Access denied");
        }
        // Prevent editing system roles
        if (role.isSystem) {
            throw new AppError(403, "Cannot modify system roles");
        }
        // Update role
        const updated = await prisma.role.update({
            where: { id: roleId },
            data: {
                name: name?.trim() || role.name,
                updatedAt: new Date()
            },
            include: {
                permissions: { include: { permission: true } },
                _count: { select: { users: true } }
            }
        });
        // Update permissions if provided
        if (Array.isArray(permissions)) {
            // Remove all current permissions
            await prisma.rolePermission.deleteMany({
                where: { roleId }
            });
            // Add new permissions
            if (permissions.length > 0) {
                const permissionRecords = await prisma.permission.findMany({
                    where: { code: { in: permissions } }
                });
                if (permissionRecords.length > 0) {
                    await prisma.rolePermission.createMany({
                        data: permissionRecords.map(p => ({
                            roleId,
                            permissionId: p.id
                        }))
                    });
                }
            }
        }
        await auditService.log({
            tenantId: ctx.tenantId,
            actorUserId: ctx.userId,
            action: "role.update",
            entity: "role",
            entityId: roleId,
            metadata: { name }
        });
        res.json(updated);
    },
    async deleteRole(req, res) {
        const ctx = context(req);
        const roleId = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
        // Get role
        const role = await prisma.role.findUnique({
            where: { id: roleId },
            include: { _count: { select: { users: true } } }
        });
        if (!role) {
            throw new AppError(404, "Role not found");
        }
        if (role.tenantId !== ctx.tenantId) {
            throw new AppError(403, "Access denied");
        }
        // Prevent deleting system roles
        if (role.isSystem) {
            throw new AppError(403, "Cannot delete system roles");
        }
        // Prevent deleting roles with assigned users
        if (role._count.users > 0) {
            throw new AppError(409, "Cannot delete role with assigned users");
        }
        // Delete role
        await prisma.role.delete({
            where: { id: roleId }
        });
        await auditService.log({
            tenantId: ctx.tenantId,
            actorUserId: ctx.userId,
            action: "role.delete",
            entity: "role",
            entityId: roleId,
            metadata: { name: role.name }
        });
        res.json({ success: true });
    },
    async duplicateRole(req, res) {
        const ctx = context(req);
        const roleId = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
        // Get original role
        const originalRole = await prisma.role.findUnique({
            where: { id: roleId },
            include: { permissions: true }
        });
        if (!originalRole) {
            throw new AppError(404, "Role not found");
        }
        if (originalRole.tenantId !== ctx.tenantId) {
            throw new AppError(403, "Access denied");
        }
        // Create duplicate
        const newCode = `${originalRole.code}_copy_${Date.now()}`;
        const newRole = await prisma.role.create({
            data: {
                tenantId: ctx.tenantId,
                name: `${originalRole.name} (Copy)`,
                code: newCode,
                isSystem: false,
            },
            include: {
                permissions: { include: { permission: true } },
                _count: { select: { users: true } }
            }
        });
        // Copy permissions
        if (originalRole.permissions.length > 0) {
            await prisma.rolePermission.createMany({
                data: originalRole.permissions.map(p => ({
                    roleId: newRole.id,
                    permissionId: p.permissionId
                }))
            });
        }
        await auditService.log({
            tenantId: ctx.tenantId,
            actorUserId: ctx.userId,
            action: "role.duplicate",
            entity: "role",
            entityId: newRole.id,
            metadata: { originalRoleId: originalRole.id, originalName: originalRole.name }
        });
        res.status(201).json(newRole);
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
    async deleteApiKey(req, res) {
        const ctx = context(req);
        const apiKeyId = Array.isArray(req.params.apiKeyId) ? req.params.apiKeyId[0] : req.params.apiKeyId;
        await clientService.deleteApiKey(ctx.tenantId, ctx.userId, apiKeyId);
        res.status(204).send();
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
