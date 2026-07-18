import crypto from "node:crypto";
import { auditService } from "../../audit/services/audit.service.js";
import { clientRepository } from "../repositories/client.repository.js";
import { AppError } from "../../../common/utils/app-error.js";
import { jobDispatcher } from "../../../jobs/services/job-dispatcher.service.js";
export const clientService = {
    createFolder: clientRepository.createFolder,
    listFolders: clientRepository.listFolders,
    listDocuments: clientRepository.listDocuments,
    listSharedLinks: clientRepository.listSharedLinks,
    listWorkflows: clientRepository.listWorkflows,
    async listTeamMembers(tenantId) {
        const members = await clientRepository.listTeamMembers(tenantId);
        const users = await clientRepository.listUsersByIds(tenantId, members.map((m) => m.userId));
        const usersById = new Map(users.map((u) => [u.id, u]));
        return members.map((member) => ({
            ...member,
            user: usersById.get(member.userId) ?? null,
        }));
    },
    listRoles: clientRepository.listRoles,
    listApiKeys: clientRepository.listApiKeys,
    getSettings: clientRepository.getSettings,
    getTenantQuota: clientRepository.getTenantQuota,
    listNotifications: clientRepository.listNotifications,
    listFavorites: clientRepository.listFavorites,
    listAuditLogs: clientRepository.listAuditLogs,
    findDocumentByIdForTenant: clientRepository.findDocumentByIdForTenant,
    async shareDocument(tenantId, actorUserId, input) {
        const share = await clientRepository.createSharedLink(tenantId, {
            documentId: input.documentId,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
            allowDownload: input.allowDownload,
        });
        await auditService.log({ tenantId, actorUserId, action: "document.share", entity: "shared_link", entityId: share.id });
        return share;
    },
    async createDocument(tenantId, userId, input) {
        const quota = await clientRepository.getTenantQuota(tenantId);
        if (quota) {
            const deltaMb = Math.max(1, Math.ceil(Number(input.sizeBytes) / (1024 * 1024)));
            if (quota.storageUsedMb + deltaMb > quota.storageLimitMb) {
                throw new AppError(409, "Storage quota exceeded");
            }
            await clientRepository.incrementQuotaUsage(tenantId, deltaMb);
        }
        const document = await clientRepository.createDocument(tenantId, userId, input);
        await auditService.log({ tenantId, actorUserId: userId, action: "document.create", entity: "document", entityId: document.id });
        return document;
    },
    async favoriteDocument(tenantId, userId, documentId) {
        return clientRepository.addFavorite(tenantId, userId, documentId);
    },
    async createWorkflow(tenantId, actorUserId, input) {
        const workflow = await clientRepository.createWorkflow(tenantId, input);
        await auditService.log({ tenantId, actorUserId, action: "workflow.create", entity: "workflow", entityId: workflow.id });
        await jobDispatcher.enqueueWorkflowReminder({ tenantId, workflowId: workflow.id });
        return workflow;
    },
    async notify(tenantId, actorUserId, input) {
        const notification = await clientRepository.createNotification(tenantId, input);
        await auditService.log({ tenantId, actorUserId, action: "notification.create", entity: "notification", entityId: notification.id });
        await jobDispatcher.enqueueNotification({ tenantId, notificationId: notification.id, userId: input.userId });
        return notification;
    },
    async inviteMember(tenantId, actorUserId, userId) {
        const member = await clientRepository.inviteTeamMember(tenantId, userId, actorUserId);
        await auditService.log({ tenantId, actorUserId, action: "team.invite", entity: "team_member", entityId: member.id });
        return member;
    },
    async updateSettings(tenantId, actorUserId, input) {
        const setting = await clientRepository.updateSettings(tenantId, input);
        await auditService.log({ tenantId, actorUserId, action: "settings.update", entity: "tenant_setting", entityId: setting.id });
        return setting;
    },
    async createApiKey(tenantId, actorUserId, input) {
        const rawKey = `dms_${crypto.randomBytes(24).toString("hex")}`;
        const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
        const apiKey = await clientRepository.createApiKey(tenantId, { name: input.name, keyHash, expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined });
        await auditService.log({ tenantId, actorUserId, action: "api_key.create", entity: "api_key", entityId: apiKey.id });
        return { ...apiKey, rawKey };
    },
    async updateProfileSecurity(userId, tenantId, input) {
        const security = await clientRepository.updateProfileSecurity(userId, input);
        await auditService.log({ tenantId, actorUserId: userId, action: "profile.security.update", entity: "user_security", entityId: security.id });
        return security;
    },
};
